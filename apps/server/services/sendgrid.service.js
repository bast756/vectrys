/**
 * VECTRYS — Service SendGrid (emails transactionnels)
 *
 * Emails metier : confirmation booking, rappel check-in,
 * instructions depart, demande avis, magic link.
 * Emails employee : invitation, OTP 2FA.
 *
 * Necessite SENDGRID_API_KEY et SENDGRID_FROM_EMAIL.
 *
 * @version 2.0.0
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

// --- Emails Employee Dashboard ---

export async function sendEmployeeInvitation(to, { firstName, matricule, tempPassword, loginUrl }) {
  return sendEmail({
    to,
    subject: 'VECTRYS — Votre acces au portail employe',
    text: `Bonjour ${firstName}, votre compte employe VECTRYS a ete cree. Matricule : ${matricule}. Mot de passe temporaire : ${tempPassword}. Connectez-vous sur ${loginUrl} pour acceder a votre espace. Vous devrez changer votre mot de passe lors de la premiere connexion.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#0a0a0f;font-size:28px;">VECTRYS</h1>
          <p style="margin:8px 0 0;color:#1a1a2e;font-size:14px;">Portail Employe — Bienvenue</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#f59e0b;margin-top:0;">Bonjour ${firstName},</h2>
          <p>Votre compte employe a ete cree avec succes. Voici vos identifiants de connexion :</p>

          <div style="background:#1a1a2e;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #f59e0b;">
            <p style="margin:0 0 12px;"><strong style="color:#f59e0b;">Matricule :</strong> <code style="background:#2a2a3e;padding:4px 8px;border-radius:4px;font-size:16px;">${matricule}</code></p>
            <p style="margin:0;"><strong style="color:#f59e0b;">Mot de passe temporaire :</strong> <code style="background:#2a2a3e;padding:4px 8px;border-radius:4px;font-size:16px;">${tempPassword}</code></p>
          </div>

          <p style="color:#94a3b8;font-size:13px;">Vous devrez obligatoirement changer votre mot de passe lors de votre premiere connexion.</p>
          <p style="color:#94a3b8;font-size:13px;">Une double authentification par email sera requise a chaque connexion.</p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0a0a0f;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;">Acceder au portail</a>
          </div>

          <hr style="border:none;border-top:1px solid #2a2a3e;margin:24px 0;">
          <p style="color:#64748b;font-size:12px;text-align:center;">
            Cet email est confidentiel. Ne partagez jamais vos identifiants.<br>
            VECTRYS SAS — Tous droits reserves.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendEmployeeOtp(to, { firstName, code, purpose }) {
  const purposeText = purpose === 'login_2fa'
    ? 'connexion a votre espace employe'
    : purpose === 'password_reset'
      ? 'reinitialisation de votre mot de passe'
      : 'verification de votre compte';

  return sendEmail({
    to,
    subject: `VECTRYS — Code de verification : ${code}`,
    text: `Bonjour ${firstName}, votre code de verification pour la ${purposeText} est : ${code}. Ce code expire dans 10 minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0f;color:#e2e8f0;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;text-align:center;">
          <h1 style="margin:0;color:#0a0a0f;font-size:24px;">VECTRYS</h1>
          <p style="margin:4px 0 0;color:#1a1a2e;font-size:13px;">Code de verification</p>
        </div>
        <div style="padding:32px;">
          <p>Bonjour ${firstName},</p>
          <p>Votre code de verification pour la <strong>${purposeText}</strong> :</p>

          <div style="text-align:center;margin:28px 0;">
            <div style="display:inline-block;background:#1a1a2e;border:2px solid #f59e0b;border-radius:12px;padding:20px 40px;">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#f59e0b;">${code}</span>
            </div>
          </div>

          <p style="color:#94a3b8;font-size:13px;text-align:center;">Ce code expire dans <strong>10 minutes</strong>.</p>
          <p style="color:#94a3b8;font-size:13px;text-align:center;">Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>

          <hr style="border:none;border-top:1px solid #2a2a3e;margin:24px 0;">
          <p style="color:#64748b;font-size:11px;text-align:center;">
            Ne partagez jamais ce code. VECTRYS ne vous le demandera jamais par telephone.<br>
            VECTRYS SAS — Securite Renforcee
          </p>
        </div>
      </div>
    `,
  });
}

export default {
  sendBookingConfirmation,
  sendCheckinReminder,
  sendCheckoutInstructions,
  sendReviewRequest,
  sendMagicLink,
  sendEmployeeInvitation,
  sendEmployeeOtp,
};
