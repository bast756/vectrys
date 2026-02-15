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
  Plan,
  SubscriptionData,
} from '@/types';

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
    api.post<ApiResponse<{ success: boolean }>>('/auth/legal-accept', terms),

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
      { items: checklist.map(t => ({ id: t.id, completed: t.completed })) }
    ),

  /**
   * Obtenir les informations WiFi
   */
  getWifiInfo: (propertyId: string) =>
    api.get<
      ApiResponse<{
        ssid: string;
        password: string;
        qr_code?: string | null;
      }>
    >(`/guest-portal/property/${propertyId}/wifi`),

  /**
   * Obtenir les instructions check-in/check-out
   */
  getInstructions: (propertyId: string) =>
    api.get<
      ApiResponse<{
        checkout_time?: string;
        instructions?: string[];
        garbage_info?: string;
        checklist?: Array<{ id: string; label: string; label_en?: string; order: number; required: boolean }>;
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
   * Passer une commande (retourne order + clientSecret Stripe)
   */
  placeOrder: (items: Array<{ service_id: string; quantity: number }>) =>
    api.post<ApiResponse<Order & { clientSecret?: string }>>('/guest-portal/orders', { items }),

  /**
   * Confirmer le paiement d'une commande
   */
  confirmPayment: (orderId: string, paymentIntentId: string) =>
    api.post<ApiResponse<{ id: string; status: string; paid_at: string }>>(
      `/guest-portal/orders/${orderId}/confirm-payment`,
      { paymentIntentId }
    ),

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
   * Récupérer le statut de l'hôte (nom + temps de réponse moyen)
   */
  getHostStatus: (reservationId?: string) =>
    api.get<ApiResponse<{ hostName: string; avgResponseMinutes: number | null; online: boolean }>>('/guest-portal/chat/host-status', {
      params: { reservation_id: reservationId },
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

// ─── AI CHAT API ─────────────────────────────────────────────

export const aiChatApi = {
  sendMessage: (message: string, reservationId?: string, language?: string, conversationHistory?: Array<{ role: string; content: string }>) =>
    api.post<ApiResponse<{ message: string; suggestions: string[]; articlesUsed: Array<{ id: string; title: string }>; conversationId: string }>>('/guest-portal/ai/chat', {
      message, reservationId, language, conversationHistory,
    }),

  getHistory: (reservationId?: string, limit?: number) =>
    api.get<ApiResponse<Array<{ id: string; senderType: string; content: string; createdAt: string }>>>('/guest-portal/ai/chat/history', {
      params: { ...(reservationId && { reservationId }), ...(limit && { limit }) },
    }),
};

// ─── TRAVEL JOURNAL API ──────────────────────────────────────

export const journalApi = {
  getEntries: (type?: string, reservationId?: string) =>
    api.get<ApiResponse<any[]>>('/guest-portal/travel-journal', {
      params: { ...(type && { type }), ...(reservationId && { reservationId }) },
    }),

  createEntry: (data: { type?: string; title?: string; content: string; emoji?: string; mood?: string; photos?: string[]; reservationId?: string; tags?: string[] }) =>
    api.post<ApiResponse<any>>('/guest-portal/travel-journal', data),

  updateEntry: (id: string, data: Record<string, any>) =>
    api.patch<ApiResponse<any>>(`/guest-portal/travel-journal/${id}`, data),

  deleteEntry: (id: string) =>
    api.delete<ApiResponse<any>>(`/guest-portal/travel-journal/${id}`),

  getTrips: () =>
    api.get<ApiResponse<any[]>>('/guest-portal/travel-journal/trips'),
};

// ─── FCM / PUSH NOTIFICATIONS API ────────────────────────────

export const fcmApi = {
  /**
   * Enregistrer un token FCM pour les push notifications
   */
  registerToken: (token: string) =>
    api.post<ApiResponse<{ success: boolean }>>('/guest-portal/fcm-token', { token }),
};

// ─── SUBSCRIPTION API ────────────────────────────────────────

export const subscriptionApi = {
  getPlans: () =>
    api.get<ApiResponse<Plan[]>>('/subscription/plans'),

  getStatus: (organizationId?: string) =>
    api.get<ApiResponse<SubscriptionData>>('/subscription/status', {
      params: organizationId ? { organization_id: organizationId } : {},
    }),

  createCheckout: (plan: string, interval: string, organizationId?: string) =>
    api.post<ApiResponse<{ url: string; sessionId: string }>>('/subscription/checkout', {
      plan,
      interval,
      organization_id: organizationId,
    }),

  createPortal: (organizationId?: string) =>
    api.post<ApiResponse<{ url: string }>>('/subscription/portal', {
      organization_id: organizationId,
    }),

  startTrial: (plan?: string, organizationId?: string) =>
    api.post<ApiResponse<any>>('/subscription/trial', {
      plan: plan || 'pro',
      organization_id: organizationId,
    }),
};
