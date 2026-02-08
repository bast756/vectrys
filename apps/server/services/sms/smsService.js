import twilio from 'twilio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ServiceSMS {
  constructor() {
    if (ServiceSMS.instance) return ServiceSMS.instance;

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('❌ Credentials Twilio manquants');
    }

    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    this.numeroTwilio = process.env.TWILIO_PHONE_NUMBER;
    this.historiqueEnvois = new Map();
    console.log('✅ Service SMS initialisé');
    ServiceSMS.instance = this;
  }

  async envoyerSMS(numeroDestinataire, message, options = {}) {
    const timestampDebut = Date.now();
    try {
      const numeroValide = this.validerNumero(numeroDestinataire);
      if (!numeroValide) throw new Error('Format invalide');

      const estBloque = await this.verifierBlocklist(numeroValide);
      if (estBloque) {
        return { succes: false, raison: 'NUMERO_BLOQUE' };
      }

      if (!this.verifierRateLimiting(numeroValide)) {
        throw new Error('Rate limit dépassé');
      }

      const params = {
        body: message,
        to: numeroValide,
        from: this.numeroTwilio
      };

      const reponse = await this.client.messages.create(params);
      const duree = Date.now() - timestampDebut;

      await prisma.smsLog.create({
        data: {
          messageSid: reponse.sid,
          destinataire: numeroValide,
          messageContenu: message,
          messageResume: message.substring(0, 10),
          type: options.type || 'SMS',
          statut: 'ENVOYE',
          dureeMs: duree,
          idUtilisateur: options.idUtilisateur || null,
          dateEnvoi: new Date()
        }
      });

      console.log('✅ SMS envoyé', { messageSid: reponse.sid });
      return { succes: true, messageSid: reponse.sid, statut: reponse.status };
    } catch (erreur) {
      console.error('❌ Erreur SMS:', erreur.message);
      throw erreur;
    }
  }

  async verifierBlocklist(numero) {
    try {
      return !!(await prisma.blocklistSms.findUnique({ where: { numero } }));
    } catch {
      return false;
    }
  }

  validerNumero(numero) {
    let clean = numero.replace(/\s/g, '').replace(/[()-]/g, '').trim();
    if (!clean.startsWith('+')) {
      if (clean.startsWith('0')) {
        clean = '+33' + clean.substring(1);
      } else {
        clean = '+' + clean;
      }
    }
    return /^\+[1-9]\d{6,14}$/.test(clean) ? clean : null;
  }

  verifierRateLimiting(numero) {
    const now = Date.now();
    const window = 60000;
    const limit = 10;

    if (!this.historiqueEnvois.has(numero)) {
      this.historiqueEnvois.set(numero, []);
    }

    const recents = this.historiqueEnvois
      .get(numero)
      .filter(t => now - t < window);

    if (recents.length >= limit) return false;
    recents.push(now);
    return true;
  }

  async testerConnexion() {
    try {
      const comptes = await this.client.api.accounts.list({ limit: 1 });
      if (comptes.length > 0) {
        console.log('✅ Connexion Twilio validée');
        return true;
      }
    } catch (err) {
      console.error('❌ Erreur Twilio:', err.message);
    }
    return false;
  }
}

export default new ServiceSMS();
