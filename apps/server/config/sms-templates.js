/**
 * VECTRYS — Templates SMS avec variantes FATE
 *
 * Chaque template possède 5 variantes :
 *   F — Family    : Ton rassurant, chaleureux
 *   A — Adventure : Ton dynamique, enthousiaste
 *   T — Traveler  : Ton efficace, concis
 *   E — Escape    : Ton intime, élégant
 *   default       : Ton professionnel standard
 *
 * ⛔ RÈGLE ABSOLUE : ZÉRO référence alcool, vin, bière, spiritueux, drogues
 * ✅ Alternatives : panier gourmand, spécialités locales, thé artisanal
 *
 * @version 2.0.0
 */

// ============================================
// 🎭 TEMPLATES FATE — 8 templates × 5 variantes
// ============================================

const smsTemplates = {

  // ────────────────────────────────────────
  // 1. BIENVENUE
  // ────────────────────────────────────────
  welcome: {
    F: (params) => ({
      subject: 'Bienvenue en famille',
      body: `Bienvenue ${params.guestName} ! 🏡 Votre logement ${params.propertyName} est prêt pour toute la famille. Équipements enfants installés. Bon séjour !`
    }),
    A: (params) => ({
      subject: "L'aventure commence",
      body: `${params.guestName}, l'aventure commence ! 🎒 ${params.propertyName} vous attend. Un guide d'activités locales vous attend sur place. Profitez bien !`
    }),
    T: (params) => ({
      subject: 'Bienvenue',
      body: `Bienvenue ${params.guestName}. ${params.propertyName} prêt. WiFi et espace travail disponibles. Check-in express activé.`
    }),
    E: (params) => ({
      subject: 'Votre escapade vous attend',
      body: `${params.guestName}, votre escapade vous attend 💫 ${params.propertyName} a été préparé avec soin pour un moment inoubliable.`
    }),
    default: (params) => ({
      subject: 'Bienvenue chez VECTRYS',
      body: `Bienvenue ${params.guestName} ! Votre logement ${params.propertyName} est prêt. Nous vous souhaitons un excellent séjour.`
    })
  },

  // ────────────────────────────────────────
  // 2. CODE D'ACCÈS
  // ────────────────────────────────────────
  accessCode: {
    F: (params) => ({
      subject: "Code d'accès famille",
      body: `${params.guestName}, votre code : ${params.code}. Adresse : ${params.address}. Check-in dès ${params.checkInTime}. Sécurité enfants vérifiée ✅`
    }),
    A: (params) => ({
      subject: "Code d'accès",
      body: `${params.guestName}, code : ${params.code} 🗝️ ${params.address}. Arrivée flexible dès ${params.checkInTime}. Guide activités dans l'appart !`
    }),
    T: (params) => ({
      subject: 'Accès',
      body: `Code : ${params.code}. ${params.address}. Check-in : ${params.checkInTime}. WiFi : dans le livret d'accueil.`
    }),
    E: (params) => ({
      subject: 'Votre accès',
      body: `${params.guestName}, votre code : ${params.code} 🔑 ${params.address}. Arrivée dès ${params.checkInTime}. Check-in discret garanti.`
    }),
    default: (params) => ({
      subject: "Code d'accès",
      body: `${params.guestName}, votre code d'accès : ${params.code}. Adresse : ${params.address}. Check-in à partir de ${params.checkInTime}.`
    })
  },

  // ────────────────────────────────────────
  // 3. RAPPEL CHECKOUT
  // ────────────────────────────────────────
  checkoutReminder: {
    F: (params) => ({
      subject: 'Rappel départ',
      body: `${params.guestName}, départ prévu à ${params.checkOutTime}. Prenez votre temps 🏡 Vérifiez les affaires des enfants. ${params.instructions}`
    }),
    A: (params) => ({
      subject: 'Dernière matinée',
      body: `Dernière matinée ${params.guestName} ! ☀️ Départ : ${params.checkOutTime}. ${params.instructions}. Une balade matinale avant de partir ?`
    }),
    T: (params) => ({
      subject: 'Checkout',
      body: `Checkout : ${params.checkOutTime}. ${params.instructions}. Late checkout possible sur demande.`
    }),
    E: (params) => ({
      subject: 'Merci pour ce moment',
      body: `${params.guestName}, merci pour ce moment 💫 Départ : ${params.checkOutTime}. ${params.instructions}. Votre avis nous est précieux.`
    }),
    default: (params) => ({
      subject: 'Rappel checkout',
      body: `${params.guestName}, rappel : checkout à ${params.checkOutTime}. ${params.instructions}. Merci et bon retour !`
    })
  },

  // ────────────────────────────────────────
  // 4. OTP — Identique pour tous (sécurité)
  // ────────────────────────────────────────
  otp: {
    F: (params) => ({
      subject: 'Code VECTRYS',
      body: `Votre code VECTRYS : ${params.code} — Expire dans ${params.expirationMinutes} min. Ne partagez jamais ce code.`
    }),
    A: (params) => ({
      subject: 'Code VECTRYS',
      body: `Votre code VECTRYS : ${params.code} — Expire dans ${params.expirationMinutes} min. Ne partagez jamais ce code.`
    }),
    T: (params) => ({
      subject: 'Code VECTRYS',
      body: `Votre code VECTRYS : ${params.code} — Expire dans ${params.expirationMinutes} min. Ne partagez jamais ce code.`
    }),
    E: (params) => ({
      subject: 'Code VECTRYS',
      body: `Votre code VECTRYS : ${params.code} — Expire dans ${params.expirationMinutes} min. Ne partagez jamais ce code.`
    }),
    default: (params) => ({
      subject: 'Code VECTRYS',
      body: `Votre code VECTRYS : ${params.code} — Expire dans ${params.expirationMinutes} min. Ne partagez jamais ce code.`
    })
  },

  // ────────────────────────────────────────
  // 5. URGENT — Identique pour tous (urgence)
  // ────────────────────────────────────────
  urgent: {
    F: (params) => ({
      subject: 'URGENT VECTRYS',
      body: `⚠️ URGENT — VECTRYS ${params.message} 📞 Support : ${params.supportPhone}`
    }),
    A: (params) => ({
      subject: 'URGENT VECTRYS',
      body: `⚠️ URGENT — VECTRYS ${params.message} 📞 Support : ${params.supportPhone}`
    }),
    T: (params) => ({
      subject: 'URGENT VECTRYS',
      body: `⚠️ URGENT — VECTRYS ${params.message} 📞 Support : ${params.supportPhone}`
    }),
    E: (params) => ({
      subject: 'URGENT VECTRYS',
      body: `⚠️ URGENT — VECTRYS ${params.message} 📞 Support : ${params.supportPhone}`
    }),
    default: (params) => ({
      subject: 'URGENT VECTRYS',
      body: `⚠️ URGENT — VECTRYS ${params.message} 📞 Support : ${params.supportPhone}`
    })
  },

  // ────────────────────────────────────────
  // 6. CONFIRMATION PAIEMENT
  // ────────────────────────────────────────
  paymentConfirmed: {
    F: (params) => ({
      subject: 'Paiement confirmé',
      body: `💳 ${params.guestName}, paiement de ${params.amount}€ confirmé. Réf: ${params.bookingRef}. ${params.serviceName} — Vos enfants vont adorer !`
    }),
    A: (params) => ({
      subject: 'Paiement confirmé',
      body: `💳 ${params.guestName}, ${params.amount}€ confirmé ! Réf: ${params.bookingRef}. ${params.serviceName} — Profitez bien ! 🎒`
    }),
    T: (params) => ({
      subject: 'Paiement',
      body: `Paiement ${params.amount}€ confirmé. Réf: ${params.bookingRef}. Service: ${params.serviceName}.`
    }),
    E: (params) => ({
      subject: 'Paiement confirmé',
      body: `${params.guestName}, paiement de ${params.amount}€ confirmé 💫 Réf: ${params.bookingRef}. ${params.serviceName} — Un moment rien qu'à vous.`
    }),
    default: (params) => ({
      subject: 'Paiement confirmé',
      body: `💳 ${params.guestName}, paiement de ${params.amount}€ confirmé. Réf: ${params.bookingRef}. Service: ${params.serviceName}.`
    })
  },

  // ────────────────────────────────────────
  // 7. DEMANDE D'AVIS
  // ────────────────────────────────────────
  reviewRequest: {
    F: (params) => ({
      subject: 'Votre avis famille',
      body: `${params.guestName}, comment s'est passé le séjour en famille ? 🏡 Votre avis nous aide à progresser : ${params.reviewLink}`
    }),
    A: (params) => ({
      subject: 'Racontez vos aventures',
      body: `${params.guestName}, racontez-nous vos aventures ! 🎒 Votre retour compte : ${params.reviewLink}`
    }),
    T: (params) => ({
      subject: 'Votre avis',
      body: `${params.guestName}, votre avis professionnel compte. ${params.reviewLink}`
    }),
    E: (params) => ({
      subject: 'Un moment magique ?',
      body: `${params.guestName}, nous espérons que ce moment était magique 💫 Partagez votre expérience : ${params.reviewLink}`
    }),
    default: (params) => ({
      subject: 'Votre avis',
      body: `${params.guestName}, partagez votre expérience ! Votre avis nous est précieux : ${params.reviewLink}`
    })
  },

  // ────────────────────────────────────────
  // 8. ALERTE PROPRIÉTAIRE (variante unique)
  // ────────────────────────────────────────
  ownerBookingAlert: {
    F: (params) => ({
      subject: 'Nouvelle réservation',
      body: `📋 ${params.propertyName} — ${params.guestName}. Du ${params.checkIn} au ${params.checkOut}. ${params.amount}€. Profil : ${params.fateProfile}.`
    }),
    A: (params) => ({
      subject: 'Nouvelle réservation',
      body: `📋 ${params.propertyName} — ${params.guestName}. Du ${params.checkIn} au ${params.checkOut}. ${params.amount}€. Profil : ${params.fateProfile}.`
    }),
    T: (params) => ({
      subject: 'Nouvelle réservation',
      body: `📋 ${params.propertyName} — ${params.guestName}. Du ${params.checkIn} au ${params.checkOut}. ${params.amount}€. Profil : ${params.fateProfile}.`
    }),
    E: (params) => ({
      subject: 'Nouvelle réservation',
      body: `📋 ${params.propertyName} — ${params.guestName}. Du ${params.checkIn} au ${params.checkOut}. ${params.amount}€. Profil : ${params.fateProfile}.`
    }),
    default: (params) => ({
      subject: 'Nouvelle réservation',
      body: `📋 ${params.propertyName} — ${params.guestName}. Du ${params.checkIn} au ${params.checkOut}. ${params.amount}€. Profil : ${params.fateProfile}.`
    })
  }
};

// ============================================
// 📋 FONCTIONS UTILITAIRES
// ============================================

/**
 * Récupère un template avec la variante FATE appropriée
 *
 * @param {string} templateName - Nom du template (welcome, accessCode, etc.)
 * @param {string} fateProfile - Code profil FATE (F, A, T, E, default)
 * @param {Object} params - Variables du template
 * @returns {{ subject: string, body: string }} Message formaté
 */
function getTemplate(templateName, fateProfile = 'default', params = {}) {
  const template = smsTemplates[templateName];

  if (!template) {
    throw new Error(`Template "${templateName}" non trouvé`);
  }

  // Utiliser la variante FATE ou fallback sur default
  const variante = template[fateProfile] || template.default;

  if (!variante) {
    throw new Error(`Variante "${fateProfile}" non trouvée pour le template "${templateName}"`);
  }

  return variante(params);
}

/**
 * Liste tous les templates disponibles
 *
 * @returns {Array<{ nom: string, variantes: string[] }>}
 */
function listTemplates() {
  return Object.entries(smsTemplates).map(([nom, variantes]) => ({
    nom,
    variantes: Object.keys(variantes),
    description: _getTemplateDescription(nom)
  }));
}

/**
 * Retourne la description d'un template
 * @private
 */
function _getTemplateDescription(templateName) {
  const descriptions = {
    welcome: 'Message de bienvenue au voyageur',
    accessCode: "Code d'accès et informations arrivée",
    checkoutReminder: 'Rappel checkout avec instructions',
    otp: "Code de vérification (identique tous profils)",
    urgent: "Message d'urgence (identique tous profils)",
    paymentConfirmed: 'Confirmation de paiement',
    reviewRequest: "Demande d'avis post-séjour",
    ownerBookingAlert: 'Alerte propriétaire nouvelle réservation'
  };
  return descriptions[templateName] || '';
}

export {
  smsTemplates,
  getTemplate,
  listTemplates
};
