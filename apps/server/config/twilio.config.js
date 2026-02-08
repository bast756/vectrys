/**
 * VECTRYS — Configuration Twilio (Singleton)
 *
 * Client Twilio centralisé avec validation des credentials,
 * test de connexion automatique et gestion d'erreurs.
 *
 * @version 2.0.0
 */

import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

class TwilioConfig {
  constructor() {
    // Singleton — une seule instance
    if (TwilioConfig.instance) return TwilioConfig.instance;

    this.client = null;
    this.phoneNumber = null;
    this.initialized = false;

    try {
      this.validateCredentials();
      this.initClient();
      console.log('✅ Configuration Twilio initialisée');
    } catch (erreur) {
      console.error('❌ Erreur configuration Twilio:', erreur.message);
    }

    TwilioConfig.instance = this;
  }

  /**
   * Valide le format des credentials Twilio
   * @throws {Error} Si credentials manquants ou invalides
   */
  validateCredentials() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Vérification présence
    if (!accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID manquant dans .env');
    }
    if (!authToken) {
      throw new Error('TWILIO_AUTH_TOKEN manquant dans .env');
    }
    if (!phoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER manquant dans .env');
    }

    // Validation format Account SID (doit commencer par AC)
    if (!accountSid.startsWith('AC')) {
      throw new Error('TWILIO_ACCOUNT_SID invalide — doit commencer par "AC"');
    }

    // Validation format numéro (doit commencer par +)
    if (!phoneNumber.startsWith('+')) {
      throw new Error('TWILIO_PHONE_NUMBER invalide — doit commencer par "+"');
    }

    console.log('✅ Credentials Twilio validés');
  }

  /**
   * Initialise le client Twilio
   */
  initClient() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.initialized = true;
  }

  /**
   * Teste la connexion à l'API Twilio
   * @returns {Promise<boolean>} true si la connexion est valide
   */
  async testConnection() {
    try {
      if (!this.client) {
        console.error('❌ Client Twilio non initialisé');
        return false;
      }

      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

      if (account) {
        console.log('✅ Connexion Twilio validée —', account.friendlyName);
        return true;
      }

      return false;
    } catch (erreur) {
      console.error('❌ Erreur connexion Twilio:', erreur.message);
      return false;
    }
  }

  /**
   * Retourne le client Twilio
   * @returns {import('twilio').Twilio} Client Twilio
   */
  getClient() {
    if (!this.client) {
      throw new Error('Client Twilio non initialisé — vérifiez vos credentials');
    }
    return this.client;
  }

  /**
   * Retourne le numéro de téléphone Twilio
   * @returns {string} Numéro E.164
   */
  getPhoneNumber() {
    if (!this.phoneNumber) {
      throw new Error('Numéro Twilio non configuré');
    }
    return this.phoneNumber;
  }

  /**
   * Vérifie si le client est prêt
   * @returns {boolean}
   */
  isReady() {
    return this.initialized && this.client !== null;
  }
}

// Export singleton
const twilioConfig = new TwilioConfig();
export default twilioConfig;
