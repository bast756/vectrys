/**
 * VECTRYS — Service SendGrid (emails transactionnels)
 *
 * Emails metier : confirmation booking, rappel check-in,
 * instructions depart, demande avis, magic link.
 *
 * Necessite SENDGRID_API_KEY et SENDGRID_FROM_EMAIL.
 *
 * @version 1.0.0
 */

import sgMail from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@vectrys.com';
const FROM_NAME = 'VECTRYS';

if (API_KEY) {
  sgMail.setApiKey(API_KEY);
  console.log('✅ Service SendGrid initialise');
} else {
  console.warn('⚠️ SENDGRID_API_KEY non configuree — SendGrid desactive');
}

function ensureApiKey() {
  if (!API_KEY) {
    throw Object.assign(
      new Error('SENDGRID_API_KEY non configuree'),
      { statusCode: 503 }
    );
  }
}

async function sendEmail({ to, subject, text, html }) {
  ensureApiKey();

  await sgMail.send({
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    text,
    html,
  });

  return { success: true };
}

// --- Emails transactionnels VECTRYS ---

export async function sendBookingConfirmation(to, { guestName, propertyName, checkinDate, checkoutDate, accessCode }) {
  return sendEmail({
    to,
    subject: `Confirmation de reservation — ${propertyName}`,
    text: `Bonjour ${guestName}, votre reservation a ${propertyName} est confirmee du ${checkinDate} au ${checkoutDate}. Code d'acces : ${accessCode}`,
    html: `
      <h2>Bienvenue ${guestName} !</h2>
      <p>Votre reservation a <strong>${propertyName}</strong> est confirmee.</p>
      <p>Arrivee : ${checkinDate}<br>Depart : ${checkoutDate}</p>
      <p>Code d'acces : <strong>${accessCode}</strong></p>
      <p>A bientot !<br>L'equipe VECTRYS</p>
    `,
  });
}

export async function sendCheckinReminder(to, { guestName, propertyName, checkinTime, accessCode }) {
  return sendEmail({
    to,
    subject: `Rappel check-in demain — ${propertyName}`,
    text: `Bonjour ${guestName}, rappel : votre check-in a ${propertyName} est demain a ${checkinTime}. Code : ${accessCode}`,
    html: `
      <h2>Rappel check-in</h2>
      <p>Bonjour ${guestName},</p>
      <p>Votre arrivee a <strong>${propertyName}</strong> est prevue demain a <strong>${checkinTime}</strong>.</p>
      <p>Code d'acces : <strong>${accessCode}</strong></p>
      <p>A demain !<br>L'equipe VECTRYS</p>
    `,
  });
}

export async function sendCheckoutInstructions(to, { guestName, propertyName, checkoutTime, instructions }) {
  return sendEmail({
    to,
    subject: `Instructions de depart — ${propertyName}`,
    text: `Bonjour ${guestName}, votre check-out a ${propertyName} est a ${checkoutTime}. ${instructions}`,
    html: `
      <h2>Instructions de depart</h2>
      <p>Bonjour ${guestName},</p>
      <p>Votre depart de <strong>${propertyName}</strong> est prevu a <strong>${checkoutTime}</strong>.</p>
      <p>${instructions}</p>
      <p>Merci pour votre sejour !<br>L'equipe VECTRYS</p>
    `,
  });
}

export async function sendReviewRequest(to, { guestName, propertyName, reviewUrl }) {
  return sendEmail({
    to,
    subject: `Comment s'est passe votre sejour a ${propertyName} ?`,
    text: `Bonjour ${guestName}, nous aimerions connaitre votre avis sur votre sejour a ${propertyName}. ${reviewUrl}`,
    html: `
      <h2>Votre avis nous interesse</h2>
      <p>Bonjour ${guestName},</p>
      <p>Nous esperons que votre sejour a <strong>${propertyName}</strong> s'est bien passe.</p>
      <p><a href="${reviewUrl}" style="background:#f59e0b;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Donner mon avis</a></p>
      <p>Merci !<br>L'equipe VECTRYS</p>
    `,
  });
}

export async function sendMagicLink(to, { token, baseUrl }) {
  const link = `${baseUrl}/auth/verify?token=${token}`;
  return sendEmail({
    to,
    subject: 'Connexion a VECTRYS',
    text: `Cliquez sur ce lien pour vous connecter : ${link}. Ce lien expire dans 15 minutes.`,
    html: `
      <h2>Connexion a VECTRYS</h2>
      <p><a href="${link}" style="background:#f59e0b;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Se connecter</a></p>
      <p>Ce lien expire dans 15 minutes.</p>
      <p>Si vous n'avez pas demande cette connexion, ignorez cet email.</p>
    `,
  });
}

export default {
  sendBookingConfirmation,
  sendCheckinReminder,
  sendCheckoutInstructions,
  sendReviewRequest,
  sendMagicLink,
};
