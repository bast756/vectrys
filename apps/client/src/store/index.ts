// ============================================================
// VECTRYS — Zustand Store
// État global : Auth, Booking, Services, Chat, UI
// ============================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { tokenManager, setOnUnauthorized } from '@/api/client';
import { authApi, guestApi, servicesApi, chatApi } from '@/api/endpoints';
import { wsClient } from '@/api/websocket';
import type {
  User,
  Reservation,
  Property,
  Service,
  Order,
  OrderItem,
  ChatMessage,
  CheckoutTask,
} from '@/types';

// ─── AUTH SLICE ──────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  termsAccepted: boolean;
  error: string | null;
}

interface AuthActions {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithBookingCode: (code: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (data: { id_token: string; authorization_code: string }) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  acceptTerms: (cgu: boolean, cgv: boolean, rgpd: boolean) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// ─── BOOKING SLICE ───────────────────────────────────────────

interface BookingState {
  reservation: (Reservation & { property: Property }) | null;
  checkoutChecklist: CheckoutTask[];
  isLoadingBooking: boolean;
}

interface BookingActions {
  fetchReservation: () => Promise<void>;
  acceptRules: () => Promise<void>;
  checkin: () => Promise<void>;
  checkout: () => Promise<void>;
  toggleChecklistTask: (taskId: string) => void;
  updateChecklist: () => Promise<void>;
}

// ─── SERVICES SLICE ──────────────────────────────────────────

interface ServicesState {
  catalog: Service[];
  cart: Array<{ service: Service; quantity: number }>;
  orders: Order[];
  isLoadingServices: boolean;
}

interface ServicesActions {
  fetchCatalog: () => Promise<void>;
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<Order | null>;
  fetchOrders: () => Promise<void>;
}

// ─── CHAT SLICE ──────────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  hostOnline: boolean;
  isLoadingChat: boolean;
  wsConnected: boolean;
}

interface ChatActions {
  fetchMessages: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  connectChat: () => void;
  disconnectChat: () => void;
}

// ─── UI SLICE ────────────────────────────────────────────────

type Screen =
  | 'onboarding'
  | 'terms'
  | 'home'
  | 'arrival'
  | 'rules'
  | 'wifi'
  | 'transport'
  | 'guide'
  | 'services'
  | 'checkout'
  | 'documents'
  | 'weather'
  | 'chat'
  | 'profile'
  | 'rating'
  | 'disclosures'
  | 'notifications';

interface UIState {
  screen: Screen;
  previousScreen: Screen | null;
  lang: string;
  isOffline: boolean;
  accessibilitySettings: {
    textScale: number;
    highContrast: boolean;
    colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
    falcMode: boolean;
    ttsEnabled: boolean;
  };
}

interface UIActions {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  setLang: (lang: string) => void;
  setOffline: (offline: boolean) => void;
  updateAccessibility: (settings: Partial<UIState['accessibilitySettings']>) => void;
}

// ─── COMBINED STORE ──────────────────────────────────────────

type VectrysStore = AuthState &
  AuthActions &
  BookingState &
  BookingActions &
  ServicesState &
  ServicesActions &
  ChatState &
  ChatActions &
  UIState &
  UIActions;

export const useStore = create<VectrysStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ═══ AUTH STATE ═══
        user: null,
        isAuthenticated: false,
        isLoading: false,
        termsAccepted: false,
        error: null,

        loginWithEmail: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const res = await authApi.login(email, password);
            const payload = res.data.data;
            tokenManager.setTokens(payload.tokens);
            set({ user: payload.user, isAuthenticated: true, isLoading: false });
          } catch (err: any) {
            set({ error: err.message || 'Erreur de connexion', isLoading: false });
            throw err;
          }
        },

        loginWithBookingCode: async (code) => {
          set({ isLoading: true, error: null });
          try {
            const res = await authApi.loginWithBookingCode(code);
            const payload = res.data.data;
            tokenManager.setTokens(payload.tokens);
            set({ user: payload.user, isAuthenticated: true, isLoading: false });
          } catch (err: any) {
            set({ error: err.message || 'Code invalide', isLoading: false });
            throw err;
          }
        },

        loginWithGoogle: async (idToken) => {
          set({ isLoading: true, error: null });
          try {
            const res = await authApi.loginWithGoogle(idToken);
            const payload = res.data.data;
            tokenManager.setTokens(payload.tokens);
            set({ user: payload.user, isAuthenticated: true, isLoading: false });
          } catch (err: any) {
            set({ error: err.message || 'Erreur Google', isLoading: false });
            throw err;
          }
        },

        loginWithApple: async (appleData) => {
          set({ isLoading: true, error: null });
          try {
            const res = await authApi.loginWithApple(appleData);
            const payload = res.data.data;
            tokenManager.setTokens(payload.tokens);
            set({ user: payload.user, isAuthenticated: true, isLoading: false });
          } catch (err: any) {
            set({ error: err.message || 'Erreur Apple', isLoading: false });
            throw err;
          }
        },

        requestMagicLink: async (email) => {
          set({ isLoading: true, error: null });
          try {
            await authApi.requestMagicLink(email);
            set({ isLoading: false });
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
          }
        },

        verifyMagicLink: async (token) => {
          set({ isLoading: true, error: null });
          try {
            const res = await authApi.verifyMagicLink(token);
            const payload = res.data.data;
            tokenManager.setTokens(payload.tokens);
            set({ user: payload.user, isAuthenticated: true, isLoading: false });
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
          }
        },

        acceptTerms: async (cgu, cgv, rgpd) => {
          try {
            await authApi.acceptTerms({ cgu, cgv, rgpd });
            set({ termsAccepted: true });
          } catch (err: any) {
            set({ error: err.message });
            throw err;
          }
        },

        updateProfile: async (data) => {
          try {
            const res = await authApi.updateMe(data);
            set({ user: res.data.data });
          } catch (err: any) {
            set({ error: err.message });
            throw err;
          }
        },

        fetchMe: async () => {
          try {
            const res = await authApi.getMe();
            set({ user: res.data.data, isAuthenticated: true });
          } catch {
            set({ isAuthenticated: false, user: null });
          }
        },

        logout: () => {
          tokenManager.clearTokens();
          wsClient.disconnect();
          set({
            user: null,
            isAuthenticated: false,
            termsAccepted: false,
            reservation: null,
            catalog: [],
            cart: [],
            orders: [],
            messages: [],
            screen: 'onboarding',
          });
        },

        clearError: () => set({ error: null }),

        // ═══ BOOKING STATE ═══
        reservation: null,
        checkoutChecklist: [],
        isLoadingBooking: false,

        fetchReservation: async () => {
          set({ isLoadingBooking: true });
          try {
            const res = await guestApi.getMyReservation();
            set({ reservation: res.data.data, isLoadingBooking: false });
          } catch (err) {
            set({ isLoadingBooking: false });
            throw err;
          }
        },

        acceptRules: async () => {
          const { reservation } = get();
          if (!reservation) return;
          try {
            await guestApi.acceptHouseRules(reservation.id);
            set({
              reservation: {
                ...reservation,
                house_rules_accepted: true,
                rules_accepted_at: new Date().toISOString(),
              },
            });
          } catch (err) {
            throw err;
          }
        },

        checkin: async () => {
          const { reservation } = get();
          if (!reservation) return;
          const res = await guestApi.checkin(reservation.id);
          set({ reservation: { ...reservation, ...res.data.data } });
        },

        checkout: async () => {
          const { reservation } = get();
          if (!reservation) return;
          const res = await guestApi.checkout(reservation.id);
          set({ reservation: { ...reservation, ...res.data.data } });
        },

        toggleChecklistTask: (taskId) => {
          const { checkoutChecklist } = get();
          set({
            checkoutChecklist: checkoutChecklist.map((t) =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            ),
          });
        },

        updateChecklist: async () => {
          const { reservation, checkoutChecklist } = get();
          if (!reservation) return;
          await guestApi.updateChecklist(reservation.id, checkoutChecklist);
        },

        // ═══ SERVICES STATE ═══
        catalog: [],
        cart: [],
        orders: [],
        isLoadingServices: false,

        fetchCatalog: async () => {
          const { reservation } = get();
          if (!reservation) return;
          set({ isLoadingServices: true });
          try {
            const res = await servicesApi.getCatalog(reservation.property_id);
            set({ catalog: res.data.data, isLoadingServices: false });
          } catch {
            set({ isLoadingServices: false });
          }
        },

        addToCart: (service) => {
          const { cart } = get();
          const existing = cart.find((c) => c.service.id === service.id);
          if (existing) {
            set({
              cart: cart.map((c) =>
                c.service.id === service.id ? { ...c, quantity: c.quantity + 1 } : c
              ),
            });
          } else {
            set({ cart: [...cart, { service, quantity: 1 }] });
          }
        },

        removeFromCart: (serviceId) => {
          set({ cart: get().cart.filter((c) => c.service.id !== serviceId) });
        },

        updateCartQuantity: (serviceId, quantity) => {
          if (quantity <= 0) {
            get().removeFromCart(serviceId);
            return;
          }
          set({
            cart: get().cart.map((c) =>
              c.service.id === serviceId ? { ...c, quantity } : c
            ),
          });
        },

        clearCart: () => set({ cart: [] }),

        placeOrder: async () => {
          const { cart } = get();
          if (cart.length === 0) return null;
          try {
            const res = await servicesApi.placeOrder(
              cart.map((c) => ({ service_id: c.service.id, quantity: c.quantity }))
            );
            const order = res.data.data;
            set({ cart: [], orders: [order, ...get().orders] });
            return order;
          } catch (err) {
            throw err;
          }
        },

        fetchOrders: async () => {
          try {
            const res = await servicesApi.getMyOrders();
            set({ orders: res.data.data });
          } catch {
            // Silently fail
          }
        },

        // ═══ CHAT STATE ═══
        messages: [],
        isTyping: false,
        hostOnline: false,
        isLoadingChat: false,
        wsConnected: false,

        fetchMessages: async () => {
          set({ isLoadingChat: true });
          try {
            const res = await chatApi.getMessages();
            set({ messages: res.data.data, isLoadingChat: false });
          } catch {
            set({ isLoadingChat: false });
          }
        },

        sendMessage: async (text) => {
          // Optimistic UI
          const tempMsg: ChatMessage = {
            id: `temp_${Date.now()}`,
            text,
            from: 'guest',
            timestamp: new Date().toISOString(),
            read: false,
          };
          set({ messages: [...get().messages, tempMsg] });

          // Try WebSocket first, fallback to HTTP
          const sent = wsClient.sendMessage(text);
          if (!sent) {
            try {
              const res = await chatApi.sendMessage(text);
              set({
                messages: get().messages.map((m) => (m.id === tempMsg.id ? res.data.data : m)),
              });
            } catch {
              // Remove optimistic message on failure
              set({
                messages: get().messages.filter((m) => m.id !== tempMsg.id),
              });
            }
          }
        },

        connectChat: () => {
          const { reservation } = get();
          if (!reservation) return;

          wsClient
            .on('onMessage', (msg) => {
              set({ messages: [...get().messages, msg] });
            })
            .on('onTyping', ({ isTyping }) => {
              set({ isTyping });
            })
            .on('onPresence', ({ online }) => {
              set({ hostOnline: online });
            })
            .on('onError', (error) => {
              console.warn('[Chat WS]', error);
              set({ wsConnected: false });
            });

          wsClient.connect(reservation.id);
          set({ wsConnected: true });
        },

        disconnectChat: () => {
          wsClient.disconnect();
          set({ wsConnected: false });
        },

        // ═══ UI STATE ═══
        screen: 'onboarding',
        previousScreen: null,
        lang: navigator.language?.slice(0, 2) || 'fr',
        isOffline: !navigator.onLine,
        accessibilitySettings: {
          textScale: 1,
          highContrast: false,
          colorblindMode: 'none',
          falcMode: false,
          ttsEnabled: false,
        },

        navigate: (screen) => {
          set({ previousScreen: get().screen, screen });
        },

        goBack: () => {
          const { previousScreen } = get();
          if (previousScreen) {
            set({ screen: previousScreen, previousScreen: null });
          }
        },

        setLang: (lang) => {
          set({ lang });
          // Persister la préférence utilisateur
          const { user } = get();
          if (user) {
            authApi.updateMe({ lang }).catch(() => {});
          }
        },

        setOffline: (offline) => set({ isOffline: offline }),

        updateAccessibility: (settings) => {
          set({
            accessibilitySettings: { ...get().accessibilitySettings, ...settings },
          });
        },
      }),
      {
        name: 'vectrys-store',
        // Ne persister que certains champs
        partialize: (state) => ({
          lang: state.lang,
          accessibilitySettings: state.accessibilitySettings,
          termsAccepted: state.termsAccepted,
        }),
      }
    ),
    { name: 'VectrysStore' }
  )
);

// ─── SETUP AUTO-LOGOUT SUR 401 ──────────────────────────────

setOnUnauthorized(() => {
  useStore.getState().logout();
});

// ─── SETUP OFFLINE DETECTION ─────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useStore.getState().setOffline(false));
  window.addEventListener('offline', () => useStore.getState().setOffline(true));
}

// ─── CONVENIENCE SELECTORS ───────────────────────────────────

export const useAuth = () =>
  useStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    isLoading: s.isLoading,
    error: s.error,
    termsAccepted: s.termsAccepted,
    loginWithEmail: s.loginWithEmail,
    loginWithBookingCode: s.loginWithBookingCode,
    loginWithGoogle: s.loginWithGoogle,
    loginWithApple: s.loginWithApple,
    requestMagicLink: s.requestMagicLink,
    verifyMagicLink: s.verifyMagicLink,
    acceptTerms: s.acceptTerms,
    updateProfile: s.updateProfile,
    fetchMe: s.fetchMe,
    logout: s.logout,
    clearError: s.clearError,
  }));

export const useBooking = () =>
  useStore((s) => ({
    reservation: s.reservation,
    checkoutChecklist: s.checkoutChecklist,
    isLoading: s.isLoadingBooking,
    fetchReservation: s.fetchReservation,
    acceptRules: s.acceptRules,
    checkin: s.checkin,
    checkout: s.checkout,
    toggleChecklistTask: s.toggleChecklistTask,
    updateChecklist: s.updateChecklist,
  }));

export const useServices = () =>
  useStore((s) => ({
    catalog: s.catalog,
    cart: s.cart,
    orders: s.orders,
    isLoading: s.isLoadingServices,
    cartTotal: s.cart.reduce((sum, c) => sum + c.service.price * c.quantity, 0),
    cartCount: s.cart.reduce((sum, c) => sum + c.quantity, 0),
    fetchCatalog: s.fetchCatalog,
    addToCart: s.addToCart,
    removeFromCart: s.removeFromCart,
    updateCartQuantity: s.updateCartQuantity,
    clearCart: s.clearCart,
    placeOrder: s.placeOrder,
    fetchOrders: s.fetchOrders,
  }));

export const useChat = () =>
  useStore((s) => ({
    messages: s.messages,
    isTyping: s.isTyping,
    hostOnline: s.hostOnline,
    isLoading: s.isLoadingChat,
    wsConnected: s.wsConnected,
    fetchMessages: s.fetchMessages,
    sendMessage: s.sendMessage,
    connectChat: s.connectChat,
    disconnectChat: s.disconnectChat,
  }));

export const useUI = () =>
  useStore((s) => ({
    screen: s.screen,
    lang: s.lang,
    isOffline: s.isOffline,
    accessibilitySettings: s.accessibilitySettings,
    navigate: s.navigate,
    goBack: s.goBack,
    setLang: s.setLang,
    setOffline: s.setOffline,
    updateAccessibility: s.updateAccessibility,
  }));
