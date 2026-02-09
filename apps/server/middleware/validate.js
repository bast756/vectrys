// ============================================
// VECTRYS — Validation Schemas (Zod)
// Schémas de validation pour les routes auth
// ============================================

import { z } from 'zod';

// ─── Middleware de validation ────────────────

/**
 * Crée un middleware Express qui valide req.body avec un schéma Zod
 * @param {z.ZodSchema} schema
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: 'Validation échouée', details: errors });
    }
    req.validated = result.data;
    next();
  };
}

// ─── Schémas Auth ───────────────────────────

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase().trim(),
});

export const magicLinkVerifySchema = z.object({
  token: z.string().min(1, 'Token requis'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token requis'),
});

export const appleAuthSchema = z.object({
  identityToken: z.string().min(1, 'Apple identity token requis'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const reservationCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Code réservation requis')
    .toUpperCase()
    .trim(),
  lastName: z
    .string()
    .min(1, 'Nom de famille requis')
    .trim(),
});

export const legalAcceptSchema = z.object({
  cguAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter les CGU' }),
  }),
  rgpdAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter la politique RGPD' }),
  }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requis'),
});
