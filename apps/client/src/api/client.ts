// ============================================================
// VECTRYS — Axios Client avec JWT Auto-Refresh
// ============================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { AuthTokens, ApiError } from '@/types';

// ─── CONFIGURATION ───────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_REFRESH_ENDPOINT = '/auth/refresh';

// ─── TOKEN MANAGER ───────────────────────────────────────────

class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;

    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
      localStorage.setItem('token_expires_at', String(Date.now() + tokens.expires_in * 1000));
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
    }
  }

  async refreshAccessToken(): Promise<string> {
    // Si déjà en train de refresh, attendre le résultat
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = (async () => {
      try {
        const response = await axios.post<{ data: AuthTokens }>(
          `${API_BASE_URL}${TOKEN_REFRESH_ENDPOINT}`,
          { refresh_token: refreshToken }
        );

        const newTokens = response.data.data;
        this.setTokens(newTokens);
        return newTokens.access_token;
      } catch (error) {
        this.clearTokens();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const tokenManager = new TokenManager();

// ─── AXIOS INSTANCE ──────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR (JWT AUTO-ATTACH) ───────────────────

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR (AUTO-REFRESH ON 401) ──────────────

let onUnauthorizedCallback: (() => void) | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Si 401 et pas déjà retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tenter de refresh le token
        const newAccessToken = await tokenManager.refreshAccessToken();

        // Réessayer la requête avec le nouveau token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed → logout
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    // Formater l'erreur
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'Une erreur est survenue',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  }
);

// ─── AUTO-LOGOUT CALLBACK ────────────────────────────────────

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorizedCallback = callback;
}

// ─── EXPORTS ─────────────────────────────────────────────────

export default apiClient;
