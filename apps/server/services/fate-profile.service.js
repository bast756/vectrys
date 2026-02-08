/**
 * VECTRYS — Service de Profilage FATE
 *
 * Détection automatique du profil comportemental des voyageurs :
 *   F — Family    : Familles avec enfants
 *   A — Adventure : Voyageurs actifs
 *   T — Traveler  : Professionnels/Business
 *   E — Escape    : Couples/Romantique
 *
 * Phase 1 : Détection par règles simples
 * Phase 2 : Détection par LLM (future)
 *
 * @version 2.0.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mots-clés de détection par profil
const MOTS_CLES_FATE = {
  F: ['enfant', 'bébé', 'famille', 'lit parapluie', 'chaise haute', 'kids', 'baby',
      'poussette', 'couches', 'biberon', 'parc bébé', 'enfants', 'familial'],
  A: ['randonnée', 'activités', 'sport', 'kayak', 'vélo', 'hiking', 'trek',
      'escalade', 'surf', 'plongée', 'aventure', 'nature', 'outdoor', 'trail'],
  T: ['wifi', 'bureau', 'workspace', 'réunion', 'meeting', 'calme', 'business',
      'travail', 'connexion', 'professionnel', 'desk', 'ordinateur', 'imprimante'],
  E: ['romantique', 'anniversaire', 'surprise', 'couple', 'intimate', 'lune de miel',
      'saint-valentin', 'champagne', 'dîner', 'bougie', 'spa', 'détente', 'escapade']
};

// Périodes de vacances scolaires françaises (dates moyennes zones A/B/C)
const VACANCES_SCOLAIRES = [
  { nom: 'Toussaint', debut: { mois: 10, jour: 19 }, fin: { mois: 11, jour: 3 } },
  { nom: 'Noël', debut: { mois: 12, jour: 21 }, fin: { mois: 1, jour: 6 } },
  { nom: 'Février', debut: { mois: 2, jour: 8 }, fin: { mois: 3, jour: 10 } },
  { nom: 'Pâques', debut: { mois: 4, jour: 5 }, fin: { mois: 4, jour: 21 } },
  { nom: 'Été', debut: { mois: 7, jour: 1 }, fin: { mois: 8, jour: 31 } }
];

class FATEProfileService {
  constructor() {
    console.log('✅ Service FATE Profile initialisé');
  }

  /**
   * Détecte le profil FATE à partir des données de réservation
   *
   * @param {Object} bookingData - Données de réservation
   * @param {number} bookingData.nbGuests - Nombre de voyageurs
   * @param {number} bookingData.duration - Durée du séjour en jours
   * @param {string} bookingData.propertyType - Type de logement (studio, apartment, house, villa)
   * @param {string} bookingData.period - Date ISO du séjour
   * @param {boolean} bookingData.hasChildren - Présence d'enfants
   * @param {string[]} bookingData.guestMessages - Messages du voyageur (optionnel)
   * @returns {{ profile: string, confidence: number, reasons: string[] }}
   */
  detectProfile(bookingData) {
    try {
      const {
        nbGuests = 1,
        duration = 1,
        propertyType = '',
        period = new Date().toISOString(),
        hasChildren = false,
        guestMessages = []
      } = bookingData || {};

      const dateSeance = new Date(period);
      const estVacancesScolaires = this.isSchoolHoliday(dateSeance);
      const estVacances = this.isVacationPeriod(dateSeance);

      // Scores par profil
      const scores = { F: 0, A: 0, T: 0, E: 0 };
      const raisons = { F: [], A: [], T: [], E: [] };

      // ── FAMILY (F) ──
      if (hasChildren === true) {
        scores.F += 0.5;
        raisons.F.push('hasChildren');
      }
      if (nbGuests >= 3 && estVacancesScolaires) {
        scores.F += 0.3;
        raisons.F.push('vacances_scolaires + nbGuests >= 3');
      }
      if (nbGuests >= 4) {
        scores.F += 0.2;
        raisons.F.push('nbGuests >= 4');
      }
      if (['house', 'villa'].includes(propertyType)) {
        scores.F += 0.1;
        raisons.F.push('logement familial');
      }

      // ── TRAVELER (T) ──
      if (nbGuests === 1 && duration <= 3) {
        scores.T += 0.4;
        raisons.T.push('solo + court séjour');
      }
      if (['studio', 'apartment'].includes(propertyType) && nbGuests === 1) {
        scores.T += 0.3;
        raisons.T.push('studio/apartment solo');
      }
      if (!estVacances && !estVacancesScolaires) {
        scores.T += 0.15;
        raisons.T.push('hors vacances');
      }
      if (duration <= 2) {
        scores.T += 0.1;
        raisons.T.push('séjour très court');
      }

      // ── ESCAPE (E) ──
      if (nbGuests === 2 && duration <= 4) {
        scores.E += 0.45;
        raisons.E.push('couple + court séjour');
      }
      if (nbGuests === 2 && !hasChildren) {
        scores.E += 0.2;
        raisons.E.push('duo sans enfants');
      }
      if (['apartment', 'villa'].includes(propertyType) && nbGuests === 2) {
        scores.E += 0.1;
        raisons.E.push('logement intimiste');
      }

      // ── ADVENTURE (A) ──
      if (duration >= 5 && estVacances) {
        scores.A += 0.4;
        raisons.A.push('long séjour en vacances');
      }
      if (duration >= 7) {
        scores.A += 0.2;
        raisons.A.push('séjour >= 7 jours');
      }
      if (nbGuests >= 2 && nbGuests <= 4 && estVacances) {
        scores.A += 0.15;
        raisons.A.push('petit groupe en vacances');
      }

      // Enrichissement par messages si disponibles
      let profilEnrichi = null;
      if (guestMessages && guestMessages.length > 0) {
        const baseProfile = this._getBestProfile(scores);
        profilEnrichi = this.enrichProfileFromMessages(
          { profile: baseProfile.profile, confidence: baseProfile.confidence, reasons: raisons[baseProfile.profile] },
          guestMessages
        );
      }

      // Déterminer le meilleur profil
      if (profilEnrichi) {
        const resultat = {
          profile: profilEnrichi.profile,
          confidence: Math.min(profilEnrichi.confidence, 1.0),
          reasons: profilEnrichi.reasons
        };
        console.log(`🎭 Profil FATE détecté : ${this.getProfileLabel(resultat.profile)} (${resultat.profile}) — Confiance : ${Math.round(resultat.confidence * 100)}%`);
        console.log(`🎭 Raisons : [${resultat.reasons.join(', ')}]`);
        return resultat;
      }

      const meilleur = this._getBestProfile(scores);

      // Si confiance trop faible → default
      if (meilleur.confidence < 0.3) {
        console.log('🎭 Profil FATE : default — Confiance insuffisante');
        return { profile: 'default', confidence: meilleur.confidence, reasons: ['confiance_insuffisante'] };
      }

      const resultat = {
        profile: meilleur.profile,
        confidence: Math.min(meilleur.confidence, 1.0),
        reasons: raisons[meilleur.profile]
      };

      console.log(`🎭 Profil FATE détecté : ${this.getProfileLabel(resultat.profile)} (${resultat.profile}) — Confiance : ${Math.round(resultat.confidence * 100)}%`);
      console.log(`🎭 Raisons : [${resultat.reasons.join(', ')}]`);

      return resultat;
    } catch (erreur) {
      console.error('❌ Erreur détection FATE:', erreur.message);
      return { profile: 'default', confidence: 0, reasons: ['erreur_detection'] };
    }
  }

  /**
   * Vérifie si une date tombe pendant les vacances scolaires françaises
   *
   * @param {Date} date - Date à vérifier
   * @returns {boolean}
   */
  isSchoolHoliday(date) {
    try {
      if (!(date instanceof Date) || isNaN(date)) return false;

      const mois = date.getMonth() + 1; // 1-12
      const jour = date.getDate();

      for (const vacances of VACANCES_SCOLAIRES) {
        const { debut, fin } = vacances;

        // Gestion du cas Noël (cheval sur 2 années)
        if (debut.mois > fin.mois) {
          if ((mois === debut.mois && jour >= debut.jour) ||
              (mois > debut.mois) ||
              (mois < fin.mois) ||
              (mois === fin.mois && jour <= fin.jour)) {
            return true;
          }
        } else {
          if ((mois > debut.mois || (mois === debut.mois && jour >= debut.jour)) &&
              (mois < fin.mois || (mois === fin.mois && jour <= fin.jour))) {
            return true;
          }
        }
      }

      return false;
    } catch (erreur) {
      console.error('❌ Erreur vérification vacances scolaires:', erreur.message);
      return false;
    }
  }

  /**
   * Vérifie si une date tombe pendant une période de vacances générale
   * Inclut weekends prolongés, ponts, été
   *
   * @param {Date} date - Date à vérifier
   * @returns {boolean}
   */
  isVacationPeriod(date) {
    try {
      if (!(date instanceof Date) || isNaN(date)) return false;

      // Vacances scolaires = vacances
      if (this.isSchoolHoliday(date)) return true;

      const mois = date.getMonth() + 1;
      const jourSemaine = date.getDay(); // 0=dim, 6=sam

      // Été étendu (juin à septembre)
      if (mois >= 6 && mois <= 9) return true;

      // Weekends
      if (jourSemaine === 0 || jourSemaine === 6) return true;

      // Jours fériés français (approximatifs)
      const jour = date.getDate();
      const joursFeries = [
        { mois: 1, jour: 1 },   // Nouvel An
        { mois: 5, jour: 1 },   // Fête du Travail
        { mois: 5, jour: 8 },   // Victoire 1945
        { mois: 7, jour: 14 },  // Fête Nationale
        { mois: 8, jour: 15 },  // Assomption
        { mois: 11, jour: 1 },  // Toussaint
        { mois: 11, jour: 11 }, // Armistice
        { mois: 12, jour: 25 }  // Noël
      ];

      return joursFeries.some(jf => jf.mois === mois && jf.jour === jour);
    } catch (erreur) {
      console.error('❌ Erreur vérification vacances:', erreur.message);
      return false;
    }
  }

  /**
   * Enrichit le profil FATE en analysant les messages du voyageur
   * Ajuste le score de confiance (+0.15 par mot-clé trouvé)
   *
   * @param {{ profile: string, confidence: number, reasons: string[] }} baseProfile - Profil de base
   * @param {string[]} guestMessages - Messages du voyageur
   * @returns {{ profile: string, confidence: number, reasons: string[], keywordsFound: string[] }}
   */
  enrichProfileFromMessages(baseProfile, guestMessages) {
    try {
      if (!guestMessages || guestMessages.length === 0) return baseProfile;

      const texteComplet = guestMessages.join(' ').toLowerCase();
      const scores = { F: 0, A: 0, T: 0, E: 0 };
      const motsTrouves = { F: [], A: [], T: [], E: [] };

      // Compter les mots-clés par profil
      for (const [profil, motsCles] of Object.entries(MOTS_CLES_FATE)) {
        for (const mot of motsCles) {
          if (texteComplet.includes(mot.toLowerCase())) {
            scores[profil] += 0.15;
            motsTrouves[profil].push(mot);
          }
        }
      }

      // Trouver le profil dominant par messages
      const meilleurParMessages = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)[0];

      const profilMessage = meilleurParMessages[0];
      const scoreMessage = meilleurParMessages[1];

      // Si les messages confirment le profil de base → boost confiance
      if (profilMessage === baseProfile.profile && scoreMessage > 0) {
        return {
          profile: baseProfile.profile,
          confidence: Math.min(baseProfile.confidence + scoreMessage, 1.0),
          reasons: [...baseProfile.reasons, ...motsTrouves[profilMessage].map(m => `mot-clé: ${m}`)],
          keywordsFound: motsTrouves[profilMessage]
        };
      }

      // Si les messages suggèrent un profil différent avec score élevé → basculer
      if (scoreMessage > 0.3 && scoreMessage > baseProfile.confidence) {
        console.log(`🎭 Profil ajusté par messages : ${baseProfile.profile} → ${profilMessage}`);
        return {
          profile: profilMessage,
          confidence: Math.min(scoreMessage, 1.0),
          reasons: motsTrouves[profilMessage].map(m => `mot-clé: ${m}`),
          keywordsFound: motsTrouves[profilMessage]
        };
      }

      // Sinon, garder le profil de base avec léger boost
      return {
        ...baseProfile,
        confidence: Math.min(baseProfile.confidence + (scoreMessage * 0.5), 1.0),
        keywordsFound: motsTrouves[profilMessage]
      };
    } catch (erreur) {
      console.error('❌ Erreur enrichissement messages FATE:', erreur.message);
      return baseProfile;
    }
  }

  /**
   * Retourne le label lisible du profil FATE
   *
   * @param {string} profileCode - Code profil (F, A, T, E, default)
   * @returns {string} Label
   */
  getProfileLabel(profileCode) {
    const labels = {
      F: 'Family',
      A: 'Adventure',
      T: 'Traveler',
      E: 'Escape',
      default: 'Standard'
    };
    return labels[profileCode] || 'Standard';
  }

  /**
   * Récupère les statistiques de profilage FATE
   * Nombre de voyageurs par profil sur le mois, confiance moyenne
   *
   * @returns {Promise<Object>} Statistiques FATE
   */
  async getProfileStats() {
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

      const resultat = {
        periode: debutMois.toISOString(),
        profils: {}
      };

      for (const stat of stats) {
        resultat.profils[stat.profile] = {
          nombre: stat._count.id,
          confianceMoyenne: Math.round((stat._avg.confidence || 0) * 100) / 100
        };
      }

      console.log('📊 Stats FATE récupérées :', JSON.stringify(resultat.profils));
      return resultat;
    } catch (erreur) {
      console.error('❌ Erreur stats FATE:', erreur.message);
      return { periode: new Date().toISOString(), profils: {} };
    }
  }

  /**
   * Détermine le meilleur profil parmi les scores calculés
   * @private
   */
  _getBestProfile(scores) {
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    return {
      profile: sorted[0][0],
      confidence: sorted[0][1]
    };
  }
}

// Export singleton
const fateService = new FATEProfileService();
export default fateService;
