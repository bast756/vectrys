/**
 * VECTRYS — Contrôleur SMS avec intégration FATE
 *
 * Handlers pour toutes les routes SMS :
 * - Envoi simple, template, FATE
 * - OTP, envoi groupé
 * - Statuts, historique, stats, dashboard
 * - Webhook Twilio
 *
 * @version 2.0.0
 */

import smsService from '../services/sms.service.js';
import fateService from '../services/fate-profile.service.js';
import { listTemplates } from '../config/sms-templates.js';

class SMSController {

  /**
   * 1. POST /api/sms/send — Envoi SMS simple
   */
  async sendSMS(req, res) {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          erreur: 'Champs "to" et "message" requis',
          code: 'CHAMPS_MANQUANTS'
        });
      }

      if (!smsService.validatePhoneNumber(to)) {
        return res.status(400).json({
          erreur: 'Numéro de téléphone invalide',
          code: 'NUMERO_INVALIDE',
          exemple: '+33612345678'
        });
      }

      const resultat = await smsService.sendSMS(to, message);

      res.status(200).json({
        succes: true,
        data: resultat
      });
    } catch (erreur) {
      console.error('❌ Contrôleur sendSMS:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur envoi SMS',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 2. POST /api/sms/template — Envoi SMS avec template
   */
  async sendTemplatedSMS(req, res) {
    try {
      const { to, templateName, variables, fateProfile } = req.body;

      if (!to || !templateName) {
        return res.status(400).json({
          erreur: 'Champs "to" et "templateName" requis',
          code: 'CHAMPS_MANQUANTS'
        });
      }

      const resultat = await smsService.sendTemplatedSMS(
        to,
        templateName,
        variables || {},
        fateProfile || 'default'
      );

      res.status(200).json({
        succes: true,
        data: resultat
      });
    } catch (erreur) {
      console.error('❌ Contrôleur sendTemplatedSMS:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur envoi template SMS',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 3. 🆕 POST /api/sms/fate — Envoi SMS avec détection FATE auto
   */
  async sendFATESMS(req, res) {
    try {
      const { to, templateName, variables, bookingData } = req.body;

      if (!to || !templateName) {
        return res.status(400).json({
          erreur: 'Champs "to" et "templateName" requis',
          code: 'CHAMPS_MANQUANTS'
        });
      }

      if (!bookingData) {
        return res.status(400).json({
          erreur: 'Champ "bookingData" requis pour détection FATE',
          code: 'BOOKING_DATA_MANQUANT'
        });
      }

      const resultat = await smsService.sendFATESMS(
        to,
        templateName,
        variables || {},
        bookingData
      );

      res.status(200).json({
        succes: true,
        data: resultat,
        fateProfile: resultat.fateProfile
      });
    } catch (erreur) {
      console.error('❌ Contrôleur sendFATESMS:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur envoi FATE SMS',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 4. POST /api/sms/otp — Envoi code OTP
   */
  async sendOTP(req, res) {
    try {
      const { phoneNumber, code, expirationMinutes } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({
          erreur: 'Champs "phoneNumber" et "code" requis',
          code: 'CHAMPS_MANQUANTS'
        });
      }

      const resultat = await smsService.sendOTP(
        phoneNumber,
        code,
        expirationMinutes || 10
      );

      res.status(200).json({
        succes: true,
        data: resultat
      });
    } catch (erreur) {
      console.error('❌ Contrôleur sendOTP:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur envoi OTP',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 5. POST /api/sms/bulk — Envoi groupé simple
   */
  async sendBulkSMS(req, res) {
    try {
      const { recipients, message } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          erreur: 'Liste "recipients" requise (array non vide)',
          code: 'RECIPIENTS_MANQUANTS'
        });
      }

      if (!message) {
        return res.status(400).json({
          erreur: 'Champ "message" requis',
          code: 'MESSAGE_MANQUANT'
        });
      }

      const rapport = await smsService.sendBulkSMS(recipients, message);

      res.status(200).json({
        succes: true,
        rapport
      });
    } catch (erreur) {
      console.error('❌ Contrôleur sendBulkSMS:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur envoi groupé',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 6. 🆕 POST /api/sms/bulk/fate — Envoi groupé FATE
   */
  async sendBulkFATESMS(req, res) {
    try {
      const { bookings, templateName } = req.body;

      if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
        return res.status(400).json({
          erreur: 'Liste "bookings" requise (array non vide)',
          code: 'BOOKINGS_MANQUANTS'
        });
      }

      if (!templateName) {
        return res.status(400).json({
          erreur: 'Champ "templateName" requis',
          code: 'TEMPLATE_MANQUANT'
        });
      }

      const rapport = await smsService.sendBulkFATESMS(bookings, templateName);

      res.status(200).json({
        succes: true,
        rapport
      });
    } catch (erreur) {
      console.error('❌ Contrôleur sendBulkFATESMS:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur envoi groupé FATE',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 7. GET /api/sms/status/:messageSid — Vérifier statut
   */
  async checkStatus(req, res) {
    try {
      const { messageSid } = req.params;

      if (!messageSid) {
        return res.status(400).json({
          erreur: 'Paramètre "messageSid" requis',
          code: 'SID_MANQUANT'
        });
      }

      const statut = await smsService.verifySMSDelivery(messageSid);

      res.status(200).json({
        succes: true,
        data: statut
      });
    } catch (erreur) {
      console.error('❌ Contrôleur checkStatus:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur vérification statut',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 8. GET /api/sms/history — Historique SMS
   */
  async getHistory(req, res) {
    try {
      const filters = {
        destinataire: req.query.destinataire,
        statut: req.query.statut,
        type: req.query.type,
        dateDebut: req.query.dateDebut,
        dateFin: req.query.dateFin,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const historique = await smsService.getSMSHistory(filters);

      res.status(200).json({
        succes: true,
        data: historique
      });
    } catch (erreur) {
      console.error('❌ Contrôleur getHistory:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur récupération historique',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 9. GET /api/sms/stats — Statistiques globales
   */
  async getStats(req, res) {
    try {
      const period = req.query.period || 'month';
      const stats = await smsService.getSMSStats(period);

      res.status(200).json({
        succes: true,
        data: stats
      });
    } catch (erreur) {
      console.error('❌ Contrôleur getStats:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur récupération stats',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 10. 🆕 GET /api/sms/stats/fate — Statistiques FATE
   */
  async getFATEStats(req, res) {
    try {
      const period = req.query.period || 'month';
      const stats = await smsService.getFATEStats(period);

      res.status(200).json({
        succes: true,
        data: stats
      });
    } catch (erreur) {
      console.error('❌ Contrôleur getFATEStats:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur récupération stats FATE',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 11. GET /api/sms/dashboard — Dashboard complet
   */
  async getDashboard(req, res) {
    try {
      const period = req.query.period || 'month';

      const [statsGlobales, statsFate, templates] = await Promise.all([
        smsService.getSMSStats(period),
        smsService.getFATEStats(period),
        Promise.resolve(listTemplates())
      ]);

      res.status(200).json({
        succes: true,
        data: {
          sms: statsGlobales,
          fate: statsFate,
          templates: {
            total: templates.length,
            liste: templates
          }
        }
      });
    } catch (erreur) {
      console.error('❌ Contrôleur getDashboard:', erreur.message);
      res.status(500).json({
        erreur: 'Erreur récupération dashboard',
        code: 'ERREUR_INTERNE'
      });
    }
  }

  /**
   * 12. POST /api/webhooks/twilio — Webhook statut Twilio
   */
  async twilioWebhook(req, res) {
    try {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;

      console.log('📨 Webhook Twilio reçu', {
        messageSid: MessageSid,
        statut: MessageStatus
      });

      if (MessageSid && MessageStatus) {
        await smsService.updateSMSStatus(
          MessageSid,
          MessageStatus,
          ErrorMessage || null
        );
      }

      // Toujours répondre 200 à Twilio
      res.status(200).json({ statut: 'reçu' });
    } catch (erreur) {
      console.error('❌ Contrôleur webhook:', erreur.message);
      // Toujours répondre 200 même en cas d'erreur (éviter les retries Twilio)
      res.status(200).json({ erreur: erreur.message });
    }
  }
}

// Export singleton
const smsController = new SMSController();
export default smsController;
