import crypto from 'crypto';
import smsService from './smsService.js';

class ServiceOTP {
  constructor() {
    this.otps = new Map();
    console.log('✅ Service OTP initialisé');
  }

  async genererEtEnvoyerOTP(numeroTelephone, options = {}) {
    try {
      const dureeValidite = options.dureeMinutes || 10;
      const tentativesMax = options.tentativesMax || 3;
      const codeOTP = this.genererCode(6);

      const donneesOTP = {
        code: codeOTP,
        numeroTelephone,
        dateCreation: Date.now(),
        dateExpiration: Date.now() + dureeValidite * 60 * 1000,
        tentativesRestantes: tentativesMax,
        tentatives: [],
        valide: false
      };

      await this.stockerOTP(numeroTelephone, donneesOTP);

      const message = `Code de vérification: ${codeOTP}. Ne le communiquez à personne. Valable 10 min.`;

      const resultatSMS = await smsService.envoyerSMS(numeroTelephone, message, {
        type: 'OTP',
        priorite: 'ultra-haute'
      });

      if (!resultatSMS.succes) {
        console.warn('⚠️ Envoi OTP échoué');
        return { succes: false, raison: 'ENVOI_SMS_ECHEC' };
      }

      console.log('✅ OTP généré et envoyé', { numeroTelephone });
      return { succes: true, dureeValidite, tentativesMax };
    } catch (erreur) {
      console.error('❌ Erreur OTP:', erreur.message);
      throw erreur;
    }
  }

  async validerOTP(numeroTelephone, codeOTP) {
    try {
      const donneesOTP = await this.obtenirOTP(numeroTelephone);

      if (!donneesOTP) {
        return { valide: false, raison: 'OTP_NON_TROUVE' };
      }

      if (Date.now() > donneesOTP.dateExpiration) {
        return { valide: false, raison: 'OTP_EXPIRE' };
      }

      if (donneesOTP.tentativesRestantes <= 0) {
        return { valide: false, raison: 'TENTATIVES_EPUISEES' };
      }

      if (donneesOTP.code !== codeOTP) {
        donneesOTP.tentativesRestantes--;
        await this.stockerOTP(numeroTelephone, donneesOTP);
        return {
          valide: false,
          raison: 'CODE_INCORRECT',
          tentativesRestantes: donneesOTP.tentativesRestantes
        };
      }

      donneesOTP.valide = true;
      donneesOTP.dateValidation = Date.now();
      await this.stockerOTP(numeroTelephone, donneesOTP);

      console.log('✅ OTP validé');
      return { valide: true, dateValidation: donneesOTP.dateValidation };
    } catch (erreur) {
      console.error('❌ Erreur validation OTP:', erreur.message);
      throw erreur;
    }
  }

  genererCode(longueur = 6) {
    return crypto.randomInt(0, 10 ** longueur).toString().padStart(longueur, '0');
  }

  async stockerOTP(numeroTelephone, donnees) {
    this.otps.set(numeroTelephone, donnees);
  }

  async obtenirOTP(numeroTelephone) {
    return this.otps.get(numeroTelephone) || null;
  }

  async supprimerOTP(numeroTelephone) {
    this.otps.delete(numeroTelephone);
    console.log('🗑️ OTP supprimé');
  }
}

export default new ServiceOTP();
