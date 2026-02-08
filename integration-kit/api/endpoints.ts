// ============================================================
// VECTRYS — API Endpoints (Typé)
// ============================================================

import api from './client';
import type {
  AuthResponse,
  User,
  Reservation,
  Property,
  Service,
  Order,
  OrderItem,
  ChatMessage,
  Conversation,
  Review,
  ReviewForm,
  CheckoutTask,
  TransportOption,
  WeatherData,
  Notification,
  AITranslation,
  AIChatResponse,
  TermsAcceptance,
  ProfileUpdate,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// ─── AUTH API (PRIORITÉ 🔴 BLOQUANT) ────────────────────────

export const authApi = {
  /**
   * Login avec email/password
   */
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),

  /**
   * Login avec code de réservation (Guest Portal)
   */
  loginWithBookingCode: (code: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/booking-code', { code }),

  /**
   * Login avec Google OAuth
   */
  loginWithGoogle: (idToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/google', { id_token: idToken }),

  /**
   * Login avec Apple Sign In
   */
  loginWithApple: (data: { id_token: string; authorization_code: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/apple', data),

  /**
   * Demander un magic link par email
   */
  requestMagicLink: (email: string) =>
    api.post<ApiResponse<{ message: string }>>('/auth/magic-link/request', { email }),

  /**
   * Vérifier et se connecter via magic link
   */
  verifyMagicLink: (token: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/magic-link/verify', { token }),

  /**
   * Accepter les CGU/CGV/RGPD
   */
  acceptTerms: (terms: TermsAcceptance) =>
    api.post<ApiResponse<{ success: boolean }>>('/auth/terms/accept', terms),

  /**
   * Récupérer les infos du user connecté
   */
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),

  /**
   * Mettre à jour le profil utilisateur
   */
  updateMe: (data: ProfileUpdate) => api.patch<ApiResponse<User>>('/auth/me', data),

  /**
   * Logout (invalider le refresh token)
   */
  logout: () => api.post<ApiResponse<{ success: boolean }>>('/auth/logout'),

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refresh_token: refreshToken }),
};

// ─── GUEST PORTAL API (PRIORITÉ 🔴 BLOQUANT) ────────────────

export const guestApi = {
  /**
   * Récupérer la réservation du guest connecté
   */
  getMyReservation: () =>
    api.get<ApiResponse<Reservation & { property: Property }>>('/guest-portal/reservation'),

  /**
   * Accepter le règlement intérieur
   */
  acceptHouseRules: (reservationId: string) =>
    api.post<ApiResponse<{ success: boolean }>>(
      `/guest-portal/reservation/${reservationId}/accept-rules`
    ),

  /**
   * Check-in (arrivée)
   */
  checkin: (reservationId: string) =>
    api.post<ApiResponse<Partial<Reservation>>>(
      `/guest-portal/reservation/${reservationId}/checkin`
    ),

  /**
   * Check-out (départ)
   */
  checkout: (reservationId: string) =>
    api.post<ApiResponse<Partial<Reservation>>>(
      `/guest-portal/reservation/${reservationId}/checkout`
    ),

  /**
   * Mettre à jour la checklist de départ
   */
  updateChecklist: (reservationId: string, checklist: CheckoutTask[]) =>
    api.put<ApiResponse<{ success: boolean }>>(
      `/guest-portal/reservation/${reservationId}/checklist`,
      { checklist }
    ),

  /**
   * Obtenir les informations WiFi
   */
  getWifiInfo: (propertyId: string) =>
    api.get<
      ApiResponse<{
        ssid: string;
        password: string;
        qr_code_url?: string;
      }>
    >(`/guest-portal/property/${propertyId}/wifi`),

  /**
   * Obtenir les instructions check-in/check-out
   */
  getInstructions: (propertyId: string) =>
    api.get<
      ApiResponse<{
        check_in_instructions: string;
        check_out_instructions: string;
        house_rules: string;
        parking_info?: string;
        garbage_info?: string;
        emergency_phone?: string;
      }>
    >(`/guest-portal/property/${propertyId}/instructions`),
};

// ─── SERVICES API (PRIORITÉ 🟡 IMPORTANT) ───────────────────

export const servicesApi = {
  /**
   * Récupérer le catalogue de services d'une propriété
   */
  getCatalog: (propertyId: string) =>
    api.get<ApiResponse<Service[]>>(`/guest-portal/services`, { params: { property_id: propertyId } }),

  /**
   * Passer une commande
   */
  placeOrder: (items: Array<{ service_id: string; quantity: number }>) =>
    api.post<ApiResponse<Order>>('/guest-portal/orders', { items }),

  /**
   * Récupérer mes commandes
   */
  getMyOrders: () => api.get<ApiResponse<Order[]>>('/guest-portal/orders'),

  /**
   * Annuler une commande
   */
  cancelOrder: (orderId: string) =>
    api.post<ApiResponse<{ success: boolean }>>(`/guest-portal/orders/${orderId}/cancel`),
};

// ─── CHAT API (PRIORITÉ 🟡 IMPORTANT) ───────────────────────

export const chatApi = {
  /**
   * Récupérer l'historique des messages
   */
  getMessages: (reservationId?: string) =>
    api.get<ApiResponse<ChatMessage[]>>('/guest-portal/chat/messages', {
      params: { reservation_id: reservationId },
    }),

  /**
   * Envoyer un message (fallback HTTP si WebSocket fail)
   */
  sendMessage: (text: string, reservationId?: string) =>
    api.post<ApiResponse<ChatMessage>>('/guest-portal/chat/messages', {
      text,
      reservation_id: reservationId,
    }),

  /**
   * Marquer les messages comme lus
   */
  markAsRead: (conversationId: string) =>
    api.post<ApiResponse<{ success: boolean }>>(`/guest-portal/chat/${conversationId}/read`),
};

// ─── TRANSPORT API (PRIORITÉ 🟢 SIMPLE) ─────────────────────

export const transportApi = {
  /**
   * Récupérer les options de transport depuis/vers la propriété
   */
  getOptions: (propertyId: string) =>
    api.get<ApiResponse<TransportOption[]>>(`/guest-portal/property/${propertyId}/transport`),
};

// ─── WEATHER API (PRIORITÉ 🟢 SIMPLE) ───────────────────────

export const weatherApi = {
  /**
   * Récupérer la météo pour une propriété
   */
  getWeather: (propertyId: string) =>
    api.get<ApiResponse<WeatherData>>(`/guest-portal/property/${propertyId}/weather`),
};

// ─── REVIEWS API (PRIORITÉ 🟢 SIMPLE) ───────────────────────

export const reviewsApi = {
  /**
   * Soumettre un avis après le séjour
   */
  submitReview: (reservationId: string, review: ReviewForm) =>
    api.post<ApiResponse<Review>>(`/guest-portal/reservation/${reservationId}/review`, review),

  /**
   * Récupérer les avis d'une propriété
   */
  getPropertyReviews: (propertyId: string) =>
    api.get<ApiResponse<Review[]>>(`/guest-portal/property/${propertyId}/reviews`),
};

// ─── NOTIFICATIONS API (PRIORITÉ 🟢 SIMPLE) ─────────────────

export const notificationsApi = {
  /**
   * Récupérer les notifications de l'utilisateur
   */
  getNotifications: () => api.get<ApiResponse<Notification[]>>('/notifications'),

  /**
   * Marquer une notification comme lue
   */
  markAsRead: (notificationId: string) =>
    api.patch<ApiResponse<{ success: boolean }>>(`/notifications/${notificationId}/read`),

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead: () =>
    api.post<ApiResponse<{ success: boolean }>>('/notifications/read-all'),

  /**
   * Supprimer une notification
   */
  deleteNotification: (notificationId: string) =>
    api.delete<ApiResponse<{ success: boolean }>>(`/notifications/${notificationId}`),
};

// ─── AI API (PRIORITÉ 🟢 SIMPLE) ────────────────────────────

export const aiApi = {
  /**
   * Chat avec l'IA (Sage AI)
   */
  chat: (message: string, context?: Record<string, any>) =>
    api.post<ApiResponse<AIChatResponse>>('/ai/chat', { message, context }),

  /**
   * Traduire du texte
   */
  translate: (text: string, targetLang: string, sourceLang?: string) =>
    api.post<ApiResponse<AITranslation>>('/ai/translate', {
      text,
      target_lang: targetLang,
      source_lang: sourceLang,
    }),

  /**
   * Text-to-Speech (ElevenLabs)
   */
  textToSpeech: (text: string, lang: string, voice?: string) =>
    api.post<Blob>(
      '/ai/tts',
      { text, lang, voice },
      {
        responseType: 'blob',
        headers: { Accept: 'audio/mpeg' },
      }
    ),
};

// ─── PROPERTY API (PRIORITÉ 🟢 SIMPLE) ──────────────────────

export const propertyApi = {
  /**
   * Récupérer les détails d'une propriété
   */
  getProperty: (propertyId: string) =>
    api.get<ApiResponse<Property>>(`/guest-portal/property/${propertyId}`),

  /**
   * Récupérer le guide de la propriété (points d'intérêt, restaurants, etc.)
   */
  getGuide: (propertyId: string) =>
    api.get<
      ApiResponse<{
        restaurants: Array<{ name: string; address: string; type: string; rating: number }>;
        attractions: Array<{ name: string; description: string; distance_km: number }>;
        practical_info: Record<string, string>;
      }>
    >(`/guest-portal/property/${propertyId}/guide`),
};
