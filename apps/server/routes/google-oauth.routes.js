/**
 * VECTRYS — Routes Google OAuth 2.0
 *
 * Endpoints : URL d'auth, callback, profil utilisateur.
 * Préfixe : /api/auth/google/*
 */

import express from 'express';
import googleOAuthService from '../services/google-oauth.service.js';

const router = express.Router();

// ============================================================================
// GET /api/auth/google/url
// Génère l'URL de redirection vers Google pour le login
// ============================================================================
router.get('/url', (req, res) => {
  try {
    const state = req.query.state || undefined;
    const url = googleOAuthService.getAuthUrl(state);

    res.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('[OAUTH] Erreur génération URL:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 503 ? error.message : 'Erreur OAuth',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/auth/google/callback
// Échange le code d'autorisation et récupère le profil Google
// ============================================================================
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Champ requis : code (code d\'autorisation Google)',
      });
    }

    const { tokens, user } = await googleOAuthService.handleCallback(code);

    // Le frontend peut ensuite créer/associer le compte VECTRYS
    // et générer un JWT interne avec les infos Google.
    res.json({
      success: true,
      data: {
        user,
        google_access_token: tokens.access_token,
        expires_in: tokens.expires_in,
      },
      message: 'Authentification Google réussie',
    });
  } catch (error) {
    console.error('[OAUTH] Erreur callback:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 401
        ? 'Code d\'autorisation invalide ou expiré'
        : 'Erreur lors de l\'authentification Google',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ============================================================================
// POST /api/auth/google/userinfo
// Récupère le profil Google avec un access_token existant
// ============================================================================
router.post('/userinfo', async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: 'Champ requis : access_token',
      });
    }

    const user = await googleOAuthService.getUserInfo(access_token);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[OAUTH] Erreur userinfo:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode === 401 ? 'Token Google invalide ou expiré' : 'Erreur profil Google',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
