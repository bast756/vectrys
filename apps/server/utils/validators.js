import twilio from 'twilio';

function validerNumeroTelephone(numero) {
  if (!numero || typeof numero !== 'string') return null;

  let clean = numero.replace(/\s/g, '').replace(/[()-]/g, '').trim();

  if (!/^\+?[0-9]{6,15}$/.test(clean)) return null;

  if (!clean.startsWith('+')) {
    if (clean.startsWith('0')) {
      clean = '+33' + clean.substring(1);
    } else {
      clean = '+' + clean;
    }
  }

  if (!/^\+[1-9]\d{6,14}$/.test(clean)) return null;

  return clean;
}

function validerSignatureWebhook(twilioSignature, url, params) {
  const signature = twilio.webhooks.getExpectedSignatureHeader(
    url,
    params,
    process.env.TWILIO_WEBHOOK_AUTH_TOKEN
  );
  return signature === twilioSignature;
}

export {
  validerNumeroTelephone,
  validerSignatureWebhook
};
