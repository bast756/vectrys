const templates = {
  BIENVENUE: {
    id: 'BIENVENUE',
    nom: 'Message de bienvenue',
    corps: 'Bienvenue {nomClient}! Votre réservation au {adresseProprieté} est confirmée.',
    variables: ['nomClient', 'adresseProprieté'],
    priorite: 'haute'
  },
  CODE_ACCES_CHECKIN: {
    id: 'CODE_ACCES_CHECKIN',
    nom: "Code d'accès check-in",
    corps: "{nomClient}, votre code d'accès: {codeAcces}. Valable jusqu'à {heureExpiration}.",
    variables: ['nomClient', 'codeAcces', 'heureExpiration'],
    priorite: 'haute'
  },
  OTP_AUTHENTIFICATION: {
    id: 'OTP_AUTHENTIFICATION',
    nom: 'Code OTP',
    corps: 'Code de vérification: {otp}. Ne le communiquez à personne.',
    variables: ['otp'],
    priorite: 'ultra-haute'
  },
  ALERTE_URGENCE: {
    id: 'ALERTE_URGENCE',
    nom: 'Alerte urgence',
    corps: '🚨 {adresseProprieté} - {descriptionProblem}',
    variables: ['adresseProprieté', 'descriptionProblem'],
    priorite: 'ultra-haute'
  },
  CONFIRMATION_PAIEMENT: {
    id: 'CONFIRMATION_PAIEMENT',
    nom: 'Confirmation paiement',
    corps: '💳 Paiement de {montant}€ reçu. Réf: {numeroConfirmation}',
    variables: ['montant', 'numeroConfirmation'],
    priorite: 'haute'
  }
};

function obtenirTemplate(idTemplate) {
  return templates[idTemplate] || null;
}

function formaterMessage(idTemplate, donnees = {}) {
  const template = obtenirTemplate(idTemplate);
  if (!template) throw new Error(`Template non trouvé: ${idTemplate}`);

  let message = template.corps;
  Object.entries(donnees).forEach(([cle, valeur]) => {
    const regex = new RegExp(`\\{${cle}\\}`, 'g');
    message = message.replace(regex, String(valeur));
  });

  const variablesManquantes = message.match(/\{([^}]+)\}/g) || [];
  if (variablesManquantes.length > 0) {
    throw new Error(`Variables manquantes: ${variablesManquantes.join(', ')}`);
  }

  return message;
}

function listerTemplates() {
  return Object.values(templates).map(template => ({
    id: template.id,
    nom: template.nom,
    variables: template.variables,
    priorite: template.priorite
  }));
}

export {
  templates,
  obtenirTemplate,
  formaterMessage,
  listerTemplates
};
