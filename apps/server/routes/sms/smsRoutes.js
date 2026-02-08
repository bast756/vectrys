import express from 'express';
const router = express.Router();

import smsService from '../../services/sms/smsService.js';
import otpService from '../../services/sms/otpService.js';
import { formaterMessage, listerTemplates } from '../../config/smsTemplates.js';

import {
  validerNumeroRequete,
  validerWebhookTwilio,
  rateLimitingSMS
} from '../../middleware/sms/validationSMS.js';

// ============================================
// 🔐 AUTHENTIFICATION OTP
// ============================================

router.post('/otp/generer', validerNumeroRequete, async (req, res) => {
  try {
    const { numeroValide } = req.body;

    const resultat = await otpService.genererEtEnvoyerOTP(numeroValide);

    if (!resultat.succes) {
      return res.status(500).json({
        erreur: "Impossible d'envoyer le code OTP",
        code: resultat.raison
      });
    }

    res.status(200).json({
      succes: true,
      message: 'Code OTP envoyé par SMS',
      dureeValidite: resultat.dureeValidite,
      tentativesMax: resultat.tentativesMax
    });
  } catch (erreur) {
    console.error('❌ Erreur OTP:', erreur.message);
    res.status(500).json({
      erreur: 'Erreur serveur',
      code: 'ERREUR_INTERNE'
    });
  }
});

router.post('/otp/valider', validerNumeroRequete, async (req, res) => {
  try {
    const { numeroValide, code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({
        erreur: 'Code OTP invalide (6 chiffres)',
        code: 'CODE_INVALIDE'
      });
    }

    const resultat = await otpService.validerOTP(numeroValide, code);

    if (!resultat.valide) {
      return res.status(401).json({
        erreur: 'Code OTP incorrect ou expiré',
        code: resultat.raison,
        tentativesRestantes: resultat.tentativesRestantes
      });
    }

    await otpService.supprimerOTP(numeroValide);

    res.status(200).json({
      succes: true,
      message: 'Authentification réussie'
    });
  } catch (erreur) {
    console.error('❌ Erreur validation:', erreur.message);
    res.status(500).json({
      erreur: 'Erreur serveur',
      code: 'ERREUR_INTERNE'
    });
  }
});

// ============================================
// 📤 ENVOI SMS
// ============================================

router.post('/envoyer', rateLimitingSMS(10), validerNumeroRequete, async (req, res) => {
  try {
    const { numeroValide, message, type = 'PERSONNALISÉ' } = req.body;

    if (!message || message.length === 0) {
      return res.status(400).json({
        erreur: 'Message requis',
        code: 'MESSAGE_VIDE'
      });
    }

    const resultat = await smsService.envoyerSMS(numeroValide, message, {
      type
    });

    if (!resultat.succes) {
      return res.status(500).json({
        erreur: "Impossible d'envoyer le SMS",
        code: 'ENVOI_ECHEC'
      });
    }

    res.status(200).json({
      succes: true,
      messageSid: resultat.messageSid,
      statut: resultat.statut
    });
  } catch (erreur) {
    console.error('❌ Erreur envoi:', erreur.message);
    res.status(500).json({
      erreur: 'Erreur serveur',
      code: 'ERREUR_INTERNE'
    });
  }
});

router.post('/envoi-template', rateLimitingSMS(10), validerNumeroRequete, async (req, res) => {
  try {
    const { numeroValide, idTemplate, donnees = {} } = req.body;

    const message = formaterMessage(idTemplate, donnees);

    const resultat = await smsService.envoyerSMS(numeroValide, message, {
      type: idTemplate
    });

    if (!resultat.succes) {
      return res.status(500).json({
        erreur: "Impossible d'envoyer le SMS",
        code: 'ENVOI_ECHEC'
      });
    }

    res.status(200).json({
      succes: true,
      messageSid: resultat.messageSid,
      template: idTemplate
    });
  } catch (erreur) {
    console.error('❌ Erreur template:', erreur.message);
    res.status(500).json({
      erreur: erreur.message,
      code: 'ERREUR_INTERNE'
    });
  }
});

router.post('/envoi-groupe', rateLimitingSMS(5), async (req, res) => {
  try {
    const { destinataires, message } = req.body;

    if (!Array.isArray(destinataires) || destinataires.length === 0) {
      return res.status(400).json({
        erreur: 'Liste de destinataires requise',
        code: 'DESTINATAIRES_VIDES'
      });
    }

    const rapport = await smsService.envoyerSMSEnMasse(destinataires, message);

    res.status(200).json({
      succes: true,
      rapport
    });
  } catch (erreur) {
    console.error('❌ Erreur groupe:', erreur.message);
    res.status(500).json({
      erreur: 'Erreur serveur',
      code: 'ERREUR_INTERNE'
    });
  }
});

// ============================================
// 📋 TEMPLATES
// ============================================

router.get('/templates', (req, res) => {
  try {
    const templates = listerTemplates();
    res.status(200).json({
      succes: true,
      total: templates.length,
      templates
    });
  } catch (erreur) {
    res.status(500).json({
      erreur: 'Erreur serveur',
      code: 'ERREUR_INTERNE'
    });
  }
});

// ============================================
// 🔔 WEBHOOKS TWILIO
// ============================================

router.post('/webhooks/twilio/statut', validerWebhookTwilio, async (req, res) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

    console.log('📨 Webhook Twilio reçu', {
      messageSid: MessageSid,
      statut: MessageStatus
    });

    res.status(200).json({ statut: 'reçu' });
  } catch (erreur) {
    console.error('❌ Erreur webhook:', erreur.message);
    res.status(200).json({ erreur: erreur.message });
  }
});

export default router;
