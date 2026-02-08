import { validerNumeroTelephone, validerSignatureWebhook } from '../../utils/validators.js';

function validerNumeroRequete(req, res, next) {
  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({
      erreur: 'Numéro de téléphone requis',
      code: 'NUMERO_MANQUANT'
    });
  }

  const numeroValide = validerNumeroTelephone(numero);
  if (!numeroValide) {
    return res.status(400).json({
      erreur: 'Format numéro invalide',
      code: 'FORMAT_INVALIDE',
      exemple: '+33612345678'
    });
  }

  req.body.numeroValide = numeroValide;
  next();
}

function validerWebhookTwilio(req, res, next) {
  const twilioSignature = req.get('X-Twilio-Signature');

  if (!twilioSignature) {
    console.warn('⚠️ Webhook sans signature');
    return res.status(401).json({
      erreur: 'Signature Twilio manquante',
      code: 'SIGNATURE_MANQUANTE'
    });
  }

  const urlWebhook = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const estValide = validerSignatureWebhook(twilioSignature, urlWebhook, req.body);

  if (!estValide) {
    console.error('❌ Signature invalide');
    return res.status(401).json({
      erreur: 'Signature invalide',
      code: 'SIGNATURE_INVALIDE'
    });
  }

  console.log('✅ Webhook validé');
  next();
}

function rateLimitingSMS(limiteParMinute = 10) {
  const historique = new Map();

  return (req, res, next) => {
    const idUtilisateur = req.user?.id || req.ip;
    const maintenant = Date.now();
    const fenetre = 60000;

    if (!historique.has(idUtilisateur)) {
      historique.set(idUtilisateur, []);
    }

    const requetesRecentes = historique
      .get(idUtilisateur)
      .filter(timestamp => maintenant - timestamp < fenetre);

    if (requetesRecentes.length >= limiteParMinute) {
      console.warn(`⚠️ Rate limit atteint`);
      return res.status(429).json({
        erreur: 'Trop de requêtes',
        code: 'RATE_LIMIT_DEPASSÉ',
        limite: limiteParMinute
      });
    }

    requetesRecentes.push(maintenant);
    historique.set(idUtilisateur, requetesRecentes);
    next();
  };
}

export {
  validerNumeroRequete,
  validerWebhookTwilio,
  rateLimitingSMS
};
