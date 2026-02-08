/**
 * VECTRYS — Middleware de validation Webhook Twilio
 *
 * Vérifie l'authenticité des requêtes entrantes de Twilio
 * en validant la signature X-Twilio-Signature.
 *
 * @version 2.0.0
 */

import twilio from 'twilio';

/**
 * Middleware de validation de signature Twilio
 *
 * Vérifie que la requête provient bien de Twilio en comparant
 * la signature X-Twilio-Signature avec celle calculée à partir
 * du Auth Token, de l'URL et du body.
 *
 * En développement : validation désactivée (log warning)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function validateTwilioWebhook(req, res, next) {
  try {
    // En développement : skip la validation
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Validation webhook Twilio désactivée (mode développement)');
      return next();
    }

    const twilioSignature = req.get('X-Twilio-Signature');

    // Vérifier la présence de la signature
    if (!twilioSignature) {
      console.error('❌ Webhook sans signature X-Twilio-Signature');
      return res.status(403).json({
        erreur: 'Signature Twilio manquante',
        code: 'SIGNATURE_MANQUANTE'
      });
    }

    // Récupérer le Auth Token
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      console.error('❌ TWILIO_AUTH_TOKEN non configuré');
      return res.status(500).json({
        erreur: 'Configuration webhook incomplète',
        code: 'CONFIG_INCOMPLETE'
      });
    }

    // Construire l'URL complète du webhook
    const protocol = req.get('X-Forwarded-Proto') || req.protocol;
    const host = req.get('Host');
    const url = `${protocol}://${host}${req.originalUrl}`;

    // Valider la signature
    const isValid = twilio.validateRequest(
      authToken,
      twilioSignature,
      url,
      req.body || {}
    );

    if (!isValid) {
      console.error('❌ Signature Twilio invalide');
      return res.status(403).json({
        erreur: 'Signature Twilio invalide',
        code: 'SIGNATURE_INVALIDE'
      });
    }

    console.log('✅ Webhook Twilio validé');
    next();
  } catch (erreur) {
    console.error('❌ Erreur validation webhook:', erreur.message);
    return res.status(500).json({
      erreur: 'Erreur validation webhook',
      code: 'ERREUR_VALIDATION'
    });
  }
}

export default validateTwilioWebhook;
