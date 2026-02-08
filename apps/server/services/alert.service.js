/**
 * VECTRYS — Service d'alertes et monitoring SMS + FATE
 *
 * Surveillance automatique :
 * - Taux d'échec SMS (alerte si > 5%)
 * - Budget mensuel (500 SMS)
 * - Répartition FATE (alerte si distribution anormale)
 *
 * Appelé par le CRON toutes les heures.
 *
 * @version 2.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AlertService {
  constructor() {
    console.log('✅ Service Alertes SMS initialisé');
  }

  /**
   * 1. Vérifie le taux d'échec SMS
   * Alerte si le taux d'échec dépasse 5% sur les dernières 24h
   *
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkSMSFailureRate() {
    try {
      const il24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [total, echecs] = await Promise.all([
        prisma.smsLog.count({
          where: { dateCreation: { gte: il24h } }
        }),
        prisma.smsLog.count({
          where: {
            dateCreation: { gte: il24h },
            statut: { in: ['failed', 'undelivered', 'ECHEC'] }
          }
        })
      ]);

      if (total === 0) {
        console.log('📊 Aucun SMS envoyé dans les dernières 24h');
        return { alerte: false, total: 0, echecs: 0, taux: 0 };
      }

      const taux = (echecs / total) * 100;

      if (taux > 5) {
        console.error(`🚨 ALERTE : Taux d'échec SMS élevé — ${taux.toFixed(1)}% (${echecs}/${total})`);
        return { alerte: true, total, echecs, taux: Math.round(taux * 10) / 10 };
      }

      console.log(`✅ Taux d'échec SMS OK : ${taux.toFixed(1)}% (${echecs}/${total})`);
      return { alerte: false, total, echecs, taux: Math.round(taux * 10) / 10 };
    } catch (erreur) {
      console.error('❌ Erreur vérification taux échec:', erreur.message);
      return { alerte: false, erreur: erreur.message };
    }
  }

  /**
   * 2. Vérifie le budget SMS mensuel
   * Alerte à 80% et 90% du budget (500 SMS par défaut)
   *
   * @returns {Promise<Object>} Résultat de la vérification
   */
  async checkSMSBudget() {
    try {
      const limiteMensuelle = parseInt(process.env.SMS_DAILY_LIMIT) || 500;

      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const nombreSMS = await prisma.smsLog.count({
        where: { dateCreation: { gte: debutMois } }
      });

      const pourcentage = (nombreSMS / limiteMensuelle) * 100;

      if (pourcentage >= 100) {
        console.error(`🚫 ALERTE CRITIQUE : Budget SMS dépassé — ${nombreSMS}/${limiteMensuelle} (${pourcentage.toFixed(0)}%)`);
        return { alerte: 'critique', nombreSMS, limite: limiteMensuelle, pourcentage: Math.round(pourcentage) };
      }

      if (pourcentage >= 90) {
        console.warn(`🚨 ALERTE : Budget SMS à ${pourcentage.toFixed(0)}% — ${nombreSMS}/${limiteMensuelle}`);
        return { alerte: 'haute', nombreSMS, limite: limiteMensuelle, pourcentage: Math.round(pourcentage) };
      }

      if (pourcentage >= 80) {
        console.warn(`⚠️ Budget SMS à ${pourcentage.toFixed(0)}% — ${nombreSMS}/${limiteMensuelle}`);
        return { alerte: 'moyenne', nombreSMS, limite: limiteMensuelle, pourcentage: Math.round(pourcentage) };
      }

      console.log(`✅ Budget SMS OK : ${nombreSMS}/${limiteMensuelle} (${pourcentage.toFixed(0)}%)`);
      return { alerte: false, nombreSMS, limite: limiteMensuelle, pourcentage: Math.round(pourcentage) };
    } catch (erreur) {
      console.error('❌ Erreur vérification budget:', erreur.message);
      return { alerte: false, erreur: erreur.message };
    }
  }

  /**
   * 3. 🆕 Vérifie la répartition des profils FATE
   * Alerte si un profil représente > 60% des envois (biais potentiel)
   * Alerte si "default" > 30% (détection insuffisante)
   *
   * @returns {Promise<Object>} Résultat avec répartition
   */
  async checkFATEDistribution() {
    try {
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const stats = await prisma.fATE_Profile.groupBy({
        by: ['profile'],
        where: {
          createdAt: { gte: debutMois }
        },
        _count: { id: true },
        _avg: { confidence: true }
      });

      const totalProfils = stats.reduce((acc, s) => acc + s._count.id, 0);

      if (totalProfils === 0) {
        console.log('📊 Aucun profil FATE détecté ce mois-ci');
        return { alerte: false, totalProfils: 0, repartition: {} };
      }

      // Construire la répartition
      const repartition = {};
      const alertes = [];

      for (const stat of stats) {
        const pourcentage = Math.round((stat._count.id / totalProfils) * 100);
        repartition[stat.profile] = {
          nombre: stat._count.id,
          pourcentage,
          confianceMoyenne: Math.round((stat._avg.confidence || 0) * 100) / 100
        };

        // Alerte si un profil > 60% (biais potentiel)
        if (pourcentage > 60) {
          alertes.push(`🚨 Profil "${stat.profile}" surreprésenté : ${pourcentage}% (biais potentiel)`);
        }
      }

      // Alerte si "default" > 30% (détection insuffisante)
      if (repartition.default && repartition.default.pourcentage > 30) {
        alertes.push(`⚠️ Profil "default" à ${repartition.default.pourcentage}% — Détection FATE insuffisante`);
      }

      // Log la répartition
      const resume = Object.entries(repartition)
        .map(([profil, data]) => `${profil}:${data.pourcentage}%`)
        .join(', ');

      if (alertes.length > 0) {
        console.warn(`📊 FATE : ${resume}`);
        alertes.forEach(a => console.warn(a));
        return { alerte: true, totalProfils, repartition, alertes };
      }

      console.log(`📊 FATE : ${resume} — Distribution OK`);
      return { alerte: false, totalProfils, repartition, alertes: [] };
    } catch (erreur) {
      console.error('❌ Erreur vérification FATE:', erreur.message);
      return { alerte: false, erreur: erreur.message };
    }
  }

  /**
   * Lance toutes les vérifications (appelé par CRON)
   *
   * @returns {Promise<Object>} Résultat global
   */
  async runAllChecks() {
    console.log('🔍 Vérification santé SMS + FATE...');

    const [echecRate, budget, fateDistrib] = await Promise.all([
      this.checkSMSFailureRate(),
      this.checkSMSBudget(),
      this.checkFATEDistribution()
    ]);

    const hasAlerts = echecRate.alerte || budget.alerte || fateDistrib.alerte;

    if (hasAlerts) {
      console.warn('⚠️ Des alertes ont été détectées — vérifiez les logs ci-dessus');
    } else {
      console.log('✅ Toutes les vérifications OK');
    }

    return {
      timestamp: new Date().toISOString(),
      alertes: hasAlerts,
      echecRate,
      budget,
      fateDistribution: fateDistrib
    };
  }
}

// Export singleton
const alertService = new AlertService();
export default alertService;
