/**
 * VECTRYS — Service SMS avec intégration FATE
 *
 * Service principal d'envoi SMS via Twilio avec :
 * - Envoi simple et templated
 * - Envoi intelligent FATE (détection automatique profil)
 * - Envoi groupé (simple et FATE)
 * - OTP (sans personnalisation FATE)
 * - Historique, stats et monitoring
 *
 * ⛔ ZÉRO référence alcool/drogues dans les messages
 *
 * @version 2.0.0
 */

import twilioConfig from '../config/twilio.config.js';
import { getTemplate, listTemplates } from '../config/sms-templates.js';
import fateService from './fate-profile.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class SMSService {
  constructor() {
    this.historiqueEnvois = new Map(); // Rate limiting en mémoire
    console.log('✅ Service SMS FATE initialisé');
  }

  // ============================================
  // 📞 FORMATAGE & VALIDATION
  // ============================================

  /**
   * 1. Formate un numéro au format E.164
   *
   * @param {string} phone - Numéro de téléphone brut
   * @returns {string|null} Numéro formaté E.164 ou null si invalide
   */
  formatPhoneNumber(phone) {
    try {
      if (!phone || typeof phone !== 'string') return null;

      let clean = phone.replace(/\s/g, '').replace(/[()-]/g, '').trim();

      // Conversion numéros français sans indicatif
      if (!clean.startsWith('+')) {
        if (clean.startsWith('0')) {
          clean = '+33' + clean.substring(1);
        } else {
          clean = '+' + clean;
        }
      }

      return clean;
    } catch (erreur) {
      console.error('❌ Erreur formatage numéro:', erreur.message);
      return null;
    }
  }

  /**
   * 2. Valide un numéro de téléphone au format E.164
   *
   * @param {string} phone - Numéro à valider
   * @returns {boolean} true si valide
   */
  validatePhoneNumber(phone) {
    try {
      const formatted = this.formatPhoneNumber(phone);
      if (!formatted) return false;
      return /^\+[1-9]\d{6,14}$/.test(formatted);
    } catch (erreur) {
      console.error('❌ Erreur validation numéro:', erreur.message);
      return false;
    }
  }

  // ============================================
  // 📊 LOGGING
  // ============================================

  /**
   * 3. Enregistre un SMS dans la base de données
   *
   * @param {Object} data - Données du SMS à logger
   * @returns {Promise<Object>} Entrée créée en base
   */
  async logSMS(data) {
    try {
      const entry = await prisma.smsLog.create({
        data: {
          messageSid: data.messageSid || null,
          destinataire: data.destinataire,
          messageContenu: data.messageContenu,
          messageResume: data.messageContenu.substring(0, 50),
          type: data.type || 'SMS',
          statut: data.statut || 'ENVOYE',
          dureeMs: data.dureeMs || null,
          idUtilisateur: data.idUtilisateur || null,
          dateEnvoi: new Date()
        }
      });
      return entry;
    } catch (erreur) {
      console.error('❌ Erreur log SMS:', erreur.message);
      return null;
    }
  }

  /**
   * 4. Met à jour le statut d'un SMS après webhook
   *
   * @param {string} messageSid - SID Twilio du message
   * @param {string} status - Nouveau statut
   * @param {string|null} error - Message d'erreur si échec
   * @returns {Promise<Object|null>}
   */
  async updateSMSStatus(messageSid, status, error = null) {
    try {
      const updated = await prisma.smsLog.update({
        where: { messageSid },
        data: {
          statut: status,
          raison: error || undefined,
          dateLivraison: status === 'delivered' ? new Date() : undefined
        }
      });
      console.log(`📨 Statut SMS mis à jour : ${messageSid} → ${status}`);
      return updated;
    } catch (erreur) {
      console.error('❌ Erreur MAJ statut SMS:', erreur.message);
      return null;
    }
  }

  // ============================================
  // 📤 ENVOI SMS
  // ============================================

  /**
   * 5. Envoie un SMS simple via Twilio
   *
   * @param {string} to - Numéro destinataire
   * @param {string} message - Contenu du message
   * @param {Object} options - Options (type, idUtilisateur)
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendSMS(to, message, options = {}) {
    if (!twilioConfig.isReady()) {
      console.warn('⚠️ SMS non envoyé — Twilio non configuré');
      return { succes: false, raison: 'SERVICE_DESACTIVE' };
    }
    const timestampDebut = Date.now();
    try {
      const formatted = this.formatPhoneNumber(to);
      if (!formatted || !this.validatePhoneNumber(formatted)) {
        return { succes: false, raison: 'NUMERO_INVALIDE' };
      }

      // Vérification rate limiting
      if (!this._checkRateLimit(formatted)) {
        return { succes: false, raison: 'RATE_LIMIT_DEPASSE' };
      }

      const client = twilioConfig.getClient();
      const reponse = await client.messages.create({
        body: message,
        to: formatted,
        from: twilioConfig.getPhoneNumber()
      });

      const duree = Date.now() - timestampDebut;

      // Log en base
      await this.logSMS({
        messageSid: reponse.sid,
        destinataire: formatted,
        messageContenu: message,
        type: options.type || 'SMS',
        statut: 'ENVOYE',
        dureeMs: duree,
        idUtilisateur: options.idUtilisateur || null
      });

      console.log('✅ SMS envoyé', { messageSid: reponse.sid, duree: `${duree}ms` });
      return { succes: true, messageSid: reponse.sid, statut: reponse.status };
    } catch (erreur) {
      console.error('❌ Erreur envoi SMS:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 6. Envoie un SMS avec template (sélection FATE manuelle)
   *
   * @param {string} to - Numéro destinataire
   * @param {string} templateName - Nom du template
   * @param {Object} variables - Variables du template
   * @param {string} fateProfile - Code profil FATE (F, A, T, E, default)
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendTemplatedSMS(to, templateName, variables = {}, fateProfile = 'default') {
    try {
      const template = getTemplate(templateName, fateProfile, variables);

      const resultat = await this.sendSMS(to, template.body, {
        type: `TEMPLATE_${templateName.toUpperCase()}`
      });

      if (resultat.succes) {
        console.log(`📋 Template "${templateName}" envoyé (profil: ${fateProfile})`);
      }

      return { ...resultat, template: templateName, fateProfile };
    } catch (erreur) {
      console.error('❌ Erreur envoi template SMS:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 7. 🆕 Envoi intelligent FATE — détection automatique du profil
   *
   * @param {string} to - Numéro destinataire
   * @param {string} templateName - Nom du template
   * @param {Object} variables - Variables du template
   * @param {Object} bookingData - Données de réservation pour détection FATE
   * @returns {Promise<Object>} Résultat + profil détecté
   */
  async sendFATESMS(to, templateName, variables = {}, bookingData = {}) {
    try {
      // Détection automatique du profil FATE
      const profilDetecte = fateService.detectProfile(bookingData);

      // Si confiance < 0.6 → utiliser variante default
      const profilUtilise = profilDetecte.confidence >= 0.6
        ? profilDetecte.profile
        : 'default';

      console.log(`🎭 FATE SMS : profil ${profilUtilise} (confiance: ${Math.round(profilDetecte.confidence * 100)}%)`);

      // Envoi avec la variante FATE
      const resultat = await this.sendTemplatedSMS(to, templateName, variables, profilUtilise);

      // Sauvegarder le profil FATE en base
      try {
        await prisma.fATE_Profile.create({
          data: {
            guestPhone: this.formatPhoneNumber(to),
            profile: profilDetecte.profile,
            confidence: profilDetecte.confidence,
            reasons: profilDetecte.reasons,
            nbGuests: bookingData.nbGuests || null,
            duration: bookingData.duration || null,
            propertyType: bookingData.propertyType || null,
            hasChildren: bookingData.hasChildren || false,
            keywordsFound: profilDetecte.keywordsFound || []
          }
        });
      } catch (erreurPrisma) {
        console.warn('⚠️ Erreur sauvegarde profil FATE:', erreurPrisma.message);
      }

      return {
        ...resultat,
        fateProfile: {
          detected: profilDetecte.profile,
          used: profilUtilise,
          confidence: profilDetecte.confidence,
          reasons: profilDetecte.reasons
        }
      };
    } catch (erreur) {
      console.error('❌ Erreur envoi FATE SMS:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 8. Envoie un OTP (pas de personnalisation FATE)
   *
   * @param {string} phoneNumber - Numéro destinataire
   * @param {string} code - Code OTP
   * @param {number} expirationMinutes - Durée de validité
   * @returns {Promise<Object>} Résultat de l'envoi
   */
  async sendOTP(phoneNumber, code, expirationMinutes = 10) {
    try {
      const template = getTemplate('otp', 'default', { code, expirationMinutes });

      const resultat = await this.sendSMS(phoneNumber, template.body, {
        type: 'OTP'
      });

      console.log('🔐 OTP envoyé', { phoneNumber, expirationMinutes });
      return resultat;
    } catch (erreur) {
      console.error('❌ Erreur envoi OTP:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 9. Envoi groupé de SMS simples
   *
   * @param {Array<{phone: string, message?: string}>} recipients - Destinataires
   * @param {string} message - Message commun (si pas de message individuel)
   * @param {Object} options - Options
   * @returns {Promise<Object>} Rapport d'envoi
   */
  async sendBulkSMS(recipients, message, options = {}) {
    try {
      const rapport = {
        total: recipients.length,
        envoyes: 0,
        echecs: 0,
        details: []
      };

      for (const destinataire of recipients) {
        try {
          // Rate limiting : 1 msg/sec
          await this._delay(1000);

          const numero = destinataire.phone || destinataire;
          const msg = destinataire.message || message;

          const resultat = await this.sendSMS(numero, msg, options);

          if (resultat.succes) {
            rapport.envoyes++;
          } else {
            rapport.echecs++;
          }

          rapport.details.push({ numero, ...resultat });
        } catch (erreur) {
          rapport.echecs++;
          rapport.details.push({ numero: destinataire.phone || destinataire, succes: false, erreur: erreur.message });
        }
      }

      console.log(`📤 Envoi groupé : ${rapport.envoyes}/${rapport.total} réussis`);
      return rapport;
    } catch (erreur) {
      console.error('❌ Erreur envoi groupé:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 10. 🆕 Envoi groupé FATE — détection par booking
   *
   * @param {Array<Object>} bookings - Réservations avec données voyageur
   * @param {string} templateName - Nom du template
   * @returns {Promise<Object>} Rapport avec profils FATE
   */
  async sendBulkFATESMS(bookings, templateName) {
    try {
      const rapport = {
        total: bookings.length,
        envoyes: 0,
        echecs: 0,
        profilsUtilises: { F: 0, A: 0, T: 0, E: 0, default: 0 },
        details: []
      };

      for (const booking of bookings) {
        try {
          // Rate limiting : 1 msg/sec
          await this._delay(1000);

          const resultat = await this.sendFATESMS(
            booking.phone,
            templateName,
            booking.variables || {},
            booking.bookingData || {}
          );

          if (resultat.succes) {
            rapport.envoyes++;
            const profilUtilise = resultat.fateProfile?.used || 'default';
            rapport.profilsUtilises[profilUtilise]++;
          } else {
            rapport.echecs++;
          }

          rapport.details.push(resultat);
        } catch (erreur) {
          rapport.echecs++;
          rapport.details.push({ succes: false, erreur: erreur.message });
        }
      }

      console.log(`📤 Envoi groupé FATE : ${rapport.envoyes}/${rapport.total} réussis`);
      console.log(`🎭 Répartition FATE :`, rapport.profilsUtilises);
      return rapport;
    } catch (erreur) {
      console.error('❌ Erreur envoi groupé FATE:', erreur.message);
      throw erreur;
    }
  }

  // ============================================
  // 📊 STATUTS & HISTORIQUE
  // ============================================

  /**
   * 11. Vérifie le statut de livraison d'un SMS via Twilio
   *
   * @param {string} messageSid - SID du message Twilio
   * @returns {Promise<Object>} Statut du message
   */
  async verifySMSDelivery(messageSid) {
    if (!twilioConfig.isReady()) {
      return { erreur: 'Twilio non configuré' };
    }
    try {
      const client = twilioConfig.getClient();
      const message = await client.messages(messageSid).fetch();

      return {
        sid: message.sid,
        statut: message.status,
        dateEnvoi: message.dateSent,
        dateMaj: message.dateUpdated,
        prix: message.price,
        devise: message.priceUnit,
        erreurCode: message.errorCode,
        erreurMessage: message.errorMessage
      };
    } catch (erreur) {
      console.error('❌ Erreur vérification livraison:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 12. Récupère l'historique des SMS avec filtres
   *
   * @param {Object} filters - Filtres (destinataire, statut, type, fateProfile, dateDebut, dateFin, page, limit)
   * @returns {Promise<Object>} Historique paginé
   */
  async getSMSHistory(filters = {}) {
    try {
      const {
        destinataire,
        statut,
        type,
        dateDebut,
        dateFin,
        page = 1,
        limit = 50
      } = filters;

      const where = {};

      if (destinataire) where.destinataire = destinataire;
      if (statut) where.statut = statut;
      if (type) where.type = type;
      if (dateDebut || dateFin) {
        where.dateCreation = {};
        if (dateDebut) where.dateCreation.gte = new Date(dateDebut);
        if (dateFin) where.dateCreation.lte = new Date(dateFin);
      }

      const [total, sms] = await Promise.all([
        prisma.smsLog.count({ where }),
        prisma.smsLog.findMany({
          where,
          orderBy: { dateCreation: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        })
      ]);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sms
      };
    } catch (erreur) {
      console.error('❌ Erreur historique SMS:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 13. Récupère les statistiques globales des SMS
   *
   * @param {string} period - Période (day, week, month)
   * @returns {Promise<Object>} Statistiques
   */
  async getSMSStats(period = 'month') {
    try {
      const dateDebut = this._getStartDate(period);

      const [total, parStatut, parType] = await Promise.all([
        prisma.smsLog.count({
          where: { dateCreation: { gte: dateDebut } }
        }),
        prisma.smsLog.groupBy({
          by: ['statut'],
          where: { dateCreation: { gte: dateDebut } },
          _count: { id: true }
        }),
        prisma.smsLog.groupBy({
          by: ['type'],
          where: { dateCreation: { gte: dateDebut } },
          _count: { id: true }
        })
      ]);

      const stats = {
        periode: period,
        dateDebut: dateDebut.toISOString(),
        total,
        parStatut: {},
        parType: {},
        budget: {
          limite: parseInt(process.env.SMS_DAILY_LIMIT) || 500,
          utilise: total,
          restant: Math.max(0, (parseInt(process.env.SMS_DAILY_LIMIT) || 500) - total)
        }
      };

      parStatut.forEach(s => { stats.parStatut[s.statut] = s._count.id; });
      parType.forEach(t => { stats.parType[t.type] = t._count.id; });

      return stats;
    } catch (erreur) {
      console.error('❌ Erreur stats SMS:', erreur.message);
      throw erreur;
    }
  }

  /**
   * 14. 🆕 Récupère les statistiques par profil FATE
   *
   * @param {string} period - Période (day, week, month)
   * @returns {Promise<Object>} Statistiques FATE
   */
  async getFATEStats(period = 'month') {
    try {
      const dateDebut = this._getStartDate(period);

      const stats = await prisma.fATE_Profile.groupBy({
        by: ['profile'],
        where: {
          createdAt: { gte: dateDebut }
        },
        _count: { id: true },
        _avg: { confidence: true }
      });

      const totalProfils = stats.reduce((acc, s) => acc + s._count.id, 0);

      const resultat = {
        periode: period,
        dateDebut: dateDebut.toISOString(),
        totalProfils,
        profils: {}
      };

      for (const stat of stats) {
        resultat.profils[stat.profile] = {
          nombre: stat._count.id,
          pourcentage: totalProfils > 0 ? Math.round((stat._count.id / totalProfils) * 100) : 0,
          confianceMoyenne: Math.round((stat._avg.confidence || 0) * 100) / 100
        };
      }

      console.log('📊 Stats FATE :', JSON.stringify(resultat.profils));
      return resultat;
    } catch (erreur) {
      console.error('❌ Erreur stats FATE:', erreur.message);
      return { periode: period, totalProfils: 0, profils: {} };
    }
  }

  // ============================================
  // 🔧 MÉTHODES UTILITAIRES (privées)
  // ============================================

  /**
   * Vérifie le rate limiting pour un numéro
   * @private
   */
  _checkRateLimit(numero) {
    const now = Date.now();
    const window = 60000; // 1 minute
    const limit = 10;

    if (!this.historiqueEnvois.has(numero)) {
      this.historiqueEnvois.set(numero, []);
    }

    const recents = this.historiqueEnvois
      .get(numero)
      .filter(t => now - t < window);

    if (recents.length >= limit) {
      console.warn(`⚠️ Rate limit atteint pour ${numero}`);
      return false;
    }

    recents.push(now);
    this.historiqueEnvois.set(numero, recents);
    return true;
  }

  /**
   * Calcule la date de début selon la période
   * @private
   */
  _getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  /**
   * Délai pour rate limiting envois groupés
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
const smsService = new SMSService();
export default smsService;
