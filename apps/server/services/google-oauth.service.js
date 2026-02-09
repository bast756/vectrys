/**
 * VECTRYS — Service Google OAuth 2.0
 *
 * Authentification via Google (login social).
 * Gère la génération de l'URL d'auth, l'échange du code,
 * et la récupération du profil utilisateur.
 *
 * Nécessite GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET.
 *
 * @version 1.0.0
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

class GoogleOAuthService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback`;

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET non configurés — Google OAuth désactivé');
    } else {
      console.log('✅ Service Google OAuth initialisé');
    }
  }

  /**
   * Vérifie que les credentials sont configurés
   */
  ensureCredentials() {
    if (!this.clientId || !this.clientSecret) {
      throw Object.assign(
        new Error('Google OAuth non configuré (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants)'),
        { statusCode: 503 }
      );
    }
  }

  /**
   * Génère l'URL d'autorisation Google
   * @param {string} state - Token CSRF optionnel
   * @returns {string} URL de redirection Google
   */
  getAuthUrl(state) {
    this.ensureCredentials();

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `${GOOGLE_AUTH_URL}?${params}`;
  }

  /**
   * Échange le code d'autorisation contre des tokens
   * @param {string} code - Code reçu du callback Google
   * @returns {Promise<Object>} { access_token, refresh_token, id_token, expires_in }
   */
  async exchangeCode(code) {
    this.ensureCredentials();

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw Object.assign(
        new Error(`Google OAuth error: ${data.error_description || data.error}`),
        { statusCode: 401 }
      );
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || null,
      id_token: data.id_token,
      expires_in: data.expires_in,
    };
  }

  /**
   * Récupère le profil utilisateur Google
   * @param {string} accessToken
   * @returns {Promise<Object>} { id, email, name, picture, locale }
   */
  async getUserInfo(accessToken) {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw Object.assign(
        new Error('Impossible de récupérer le profil Google'),
        { statusCode: 401 }
      );
    }

    const data = await response.json();

    return {
      google_id: data.id,
      email: data.email,
      name: data.name,
      given_name: data.given_name,
      family_name: data.family_name,
      picture: data.picture,
      locale: data.locale,
      verified_email: data.verified_email,
    };
  }

  /**
   * Flow complet : échange code + récupération profil
   * @param {string} code
   * @returns {Promise<Object>} { tokens, user }
   */
  async handleCallback(code) {
    const tokens = await this.exchangeCode(code);
    const user = await this.getUserInfo(tokens.access_token);
    return { tokens, user };
  }
}

const googleOAuthService = new GoogleOAuthService();
export default googleOAuthService;
