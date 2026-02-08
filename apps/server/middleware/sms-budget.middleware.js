/**
 * VECTRYS — Middleware de contrôle budget SMS
 *
 * Limite le nombre de SMS envoyés par mois (phase test : 500).
 * Alerte à 90% du budget avec répartition FATE.
 * Bloque les envois si budget dépassé (status 429).
 *
 * @version 2.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware de contrôle budget SMS mensuel
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function smsBudgetMiddleware(req, res, next) {
  try {
    const limiteMensuelle = parseInt(process.env.SMS_DAILY_LIMIT) || 500;
    const seuilAlerte = 0.9; // 90%

    // Compter les SMS du mois en cours
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const nombreSMS = await prisma.smsLog.count({
      where: {
        dateCreation: { gte: debutMois }
      }
    });

    // Budget dépassé → bloquer
    if (nombreSMS >= limiteMensuelle) {
      console.error(`🚫 Budget SMS dépassé : ${nombreSMS}/${limiteMensuelle}`);
      return res.status(429).json({
        erreur: 'Budget SMS mensuel dépassé',
        code: 'BUDGET_DEPASSE',
        limite: limiteMensuelle,
        utilise: nombreSMS
      });
    }

    // Alerte à 90%
    if (nombreSMS >= limiteMensuelle * seuilAlerte) {
      await _logAlerteBudget(nombreSMS, limiteMensuelle, debutMois);
    }

    // Ajouter les infos budget à la requête
    req.smsBudget = {
      limite: limiteMensuelle,
      utilise: nombreSMS,
      restant: limiteMensuelle - nombreSMS,
      pourcentage: Math.round((nombreSMS / limiteMensuelle) * 100)
    };

    next();
  } catch (erreur) {
    console.error('❌ Erreur middleware budget SMS:', erreur.message);
    // En cas d'erreur, on laisse passer (fail-open pour ne pas bloquer)
    next();
  }
}

/**
 * Log l'alerte budget avec répartition FATE
 * @private
 */
async function _logAlerteBudget(nombreSMS, limiteMensuelle, debutMois) {
  try {
    // Récupérer la répartition par type
    const repartition = await prisma.smsLog.groupBy({
      by: ['type'],
      where: {
        dateCreation: { gte: debutMois }
      },
      _count: { id: true }
    });

    // Construire le résumé
    const resume = repartition
      .map(r => `${r.type}:${r._count.id}`)
      .join(', ');

    console.warn(
      `⚠️ Budget SMS : ${nombreSMS}/${limiteMensuelle} — Répartition : ${resume}`
    );

    // Récupérer aussi la répartition FATE
    const repartitionFATE = await prisma.fATE_Profile.groupBy({
      by: ['profile'],
      where: {
        createdAt: { gte: debutMois }
      },
      _count: { id: true }
    });

    if (repartitionFATE.length > 0) {
      const resumeFATE = repartitionFATE
        .map(r => `${r.profile}:${r._count.id}`)
        .join(', ');

      console.warn(
        `🎭 Répartition FATE : ${resumeFATE}`
      );
    }
  } catch (erreur) {
    console.error('❌ Erreur log alerte budget:', erreur.message);
  }
}

export default smsBudgetMiddleware;
