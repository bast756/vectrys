// ============================================================
// VECTRYS — Zustand Store
// État global : Auth, Booking, Services, Chat, UI
// ============================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { tokenManager, setOnUnauthorized } from '@/api/client';
import { authApi, guestApi, servicesApi, chatApi, subscriptionApi } from '@/api/endpoints';
import { wsClient } from '@/api/websocket';
import { employeeApi, employeeTokenManager, setOnEmployeeUnauthorized } from '@/api/employeeApi';
import type {
  User,
  Reservation,
  Property,
  Service,
  Order,
  OrderItem,
  ChatMessage,
  CheckoutTask,
  Plan,
  SubscriptionData,
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
  setCheckoutChecklist: (items: import('@/types').CheckoutTask[]) => void;
}

// ─── SERVICES SLICE ──────────────────────────────────────────

interface ServicesState {
  catalog: Service[];
  cart: Array<{ service: Service; quantity: number }>;
  orders: Order[];
  isLoadingServices: boolean;
  paymentClientSecret: string | null;
  pendingOrderId: string | null;
  unreadMessageCount: number;
  pendingOrderCount: number;
}

interface ServicesActions {
  fetchCatalog: () => Promise<void>;
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<{ order: Order; clientSecret?: string } | null>;
  confirmPayment: (orderId: string, paymentIntentId: string) => Promise<void>;
  clearPayment: () => void;
  fetchOrders: () => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  fetchUnreadCounts: () => void;
}

// ─── CHAT SLICE ──────────────────────────────────────────────

interface HostStatus {
  hostName: string;
  avgResponseMinutes: number | null;
  online: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  hostOnline: boolean;
  hostStatus: HostStatus | null;
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

// ─── SUBSCRIPTION SLICE ──────────────────────────────────────

interface SubscriptionState {
  plans: Plan[];
  subscription: SubscriptionData | null;
  isLoadingSubscription: boolean;
}

interface SubscriptionActions {
  fetchPlans: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  startCheckout: (plan: string, interval: string) => Promise<string | null>;
  openPortal: () => Promise<string | null>;
  startTrial: (plan?: string) => Promise<void>;
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
  UIActions &
  SubscriptionState &
  SubscriptionActions;

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

        acceptTerms: async (cgu, _cgv, rgpd) => {
          try {
            await authApi.acceptTerms({ cguAccepted: cgu, rgpdAccepted: rgpd });
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

        setCheckoutChecklist: (items) => set({ checkoutChecklist: items }),

        // ═══ SERVICES STATE ═══
        catalog: [],
        cart: [],
        orders: [],
        isLoadingServices: false,
        paymentClientSecret: null,
        pendingOrderId: null,
        unreadMessageCount: 0,
        pendingOrderCount: 0,

        fetchCatalog: async () => {
          const { reservation } = get();
          if (!reservation) return;
          set({ isLoadingServices: true });
          try {
            const res = await servicesApi.getCatalog(reservation.property?.id || reservation.property_id);
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

        clearPayment: () => set({ paymentClientSecret: null, pendingOrderId: null }),

        placeOrder: async () => {
          const { cart } = get();
          if (cart.length === 0) return null;
          try {
            const res = await servicesApi.placeOrder(
              cart.map((c) => ({ service_id: c.service.id, quantity: c.quantity }))
            );
            const data = res.data.data as any;
            const order = data;
            const clientSecret = data.clientSecret || null;
            set({
              cart: [],
              orders: [order, ...get().orders],
              paymentClientSecret: clientSecret,
              pendingOrderId: order.id,
            });
            return { order, clientSecret };
          } catch (err) {
            throw err;
          }
        },

        confirmPayment: async (orderId, paymentIntentId) => {
          try {
            await servicesApi.confirmPayment(orderId, paymentIntentId);
            set({
              paymentClientSecret: null,
              pendingOrderId: null,
              orders: get().orders.map((o) =>
                o.id === orderId ? { ...o, status: 'confirmed' as any } : o
              ),
            });
          } catch (err) {
            throw err;
          }
        },

        cancelOrder: async (orderId) => {
          try {
            await servicesApi.cancelOrder(orderId);
            set({
              orders: get().orders.map((o) =>
                o.id === orderId ? { ...o, status: 'cancelled' as any } : o
              ),
            });
          } catch (err) {
            throw err;
          }
        },

        fetchUnreadCounts: () => {
          const { orders, messages } = get();
          const pendingOrderCount = orders.filter((o) =>
            ['pending', 'confirmed', 'preparing'].includes(o.status)
          ).length;
          const unreadMessageCount = messages.filter((m) => m.from === 'host' && !m.read).length;
          set({ pendingOrderCount, unreadMessageCount });
        },

        fetchOrders: async () => {
          try {
            const res = await servicesApi.getMyOrders();
            const mapped = (res.data.data || []).map((o: any) => ({
              ...o,
              total_amount: o.total_amount ?? o.total ?? 0,
              items: (o.items || []).map((i: any) => ({
                ...i,
                id: i.id || i.name,
                service: i.service || { name: i.name },
                total_price: i.total_price ?? ((i.unit_price * i.quantity) || 0),
              })),
            }));
            set({ orders: mapped });
          } catch {
            // Silently fail
          }
        },

        // ═══ CHAT STATE ═══
        messages: [],
        isTyping: false,
        hostOnline: false,
        hostStatus: null,
        isLoadingChat: false,
        wsConnected: false,

        fetchMessages: async () => {
          set({ isLoadingChat: true });
          try {
            const { reservation } = get();
            const res = await chatApi.getMessages(reservation?.id);
            const mapped = (res.data.data || []).map((m: any) => ({
              id: m.id,
              text: m.content || m.text,
              from: m.sender_type || m.from,
              timestamp: m.created_at || m.timestamp,
              read: !!m.read_at || !!m.read,
            }));
            set({ messages: mapped, isLoadingChat: false });

            // Also fetch host status (name + avg response time)
            try {
              const { reservation } = get();
              const statusRes = await chatApi.getHostStatus(reservation?.id);
              const hs = (statusRes.data as any).data;
              if (hs) {
                set({
                  hostStatus: {
                    hostName: hs.hostName,
                    avgResponseMinutes: hs.avgResponseMinutes,
                    online: hs.online,
                  },
                });
              }
            } catch {}
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
              const { reservation } = get();
              const res = await chatApi.sendMessage(text, reservation?.id);
              const d: any = res.data.data;
              const mapped: ChatMessage = { id: d.id, text: d.content || d.text, from: d.sender_type || d.from, timestamp: d.created_at || d.timestamp, read: false };
              set({
                messages: get().messages.map((m) => (m.id === tempMsg.id ? mapped : m)),
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
              // Messages from others (host, system) — add to list
              set({ messages: [...get().messages, msg] });
            })
            .on('onMessageConfirmed', (msg) => {
              // Our own message confirmed by server — replace temp with real DB entry
              const msgs = get().messages;
              // Find the latest temp message and replace it
              const tempIdx = msgs.findIndex((m) => m.id.startsWith('temp_') && m.from === 'guest');
              if (tempIdx >= 0) {
                const updated = [...msgs];
                updated[tempIdx] = msg;
                set({ messages: updated });
              }
            })
            .on('onTyping', ({ isTyping }) => {
              set({ isTyping });
            })
            .on('onPresence', ({ online }) => {
              set({ hostOnline: online });
            })
            .on('onHostStatus', (data) => {
              set({
                hostStatus: {
                  hostName: data.hostName,
                  avgResponseMinutes: data.avgResponseMinutes,
                  online: data.online,
                },
                hostOnline: data.online,
              });
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

        // ═══ SUBSCRIPTION STATE ═══
        plans: [],
        subscription: null,
        isLoadingSubscription: false,

        fetchPlans: async () => {
          try {
            const res = await subscriptionApi.getPlans();
            set({ plans: res.data.data });
          } catch {}
        },

        fetchSubscription: async () => {
          set({ isLoadingSubscription: true });
          try {
            const res = await subscriptionApi.getStatus();
            set({ subscription: res.data.data, isLoadingSubscription: false });
          } catch {
            set({ isLoadingSubscription: false });
          }
        },

        startCheckout: async (plan, interval) => {
          try {
            const res = await subscriptionApi.createCheckout(plan, interval);
            const url = res.data.data.url;
            if (url) window.location.href = url;
            return url;
          } catch {
            return null;
          }
        },

        openPortal: async () => {
          try {
            const res = await subscriptionApi.createPortal();
            const url = res.data.data.url;
            if (url) window.location.href = url;
            return url;
          } catch {
            return null;
          }
        },

        startTrial: async (plan) => {
          try {
            await subscriptionApi.startTrial(plan);
            await get().fetchSubscription();
          } catch {}
        },
      }),
      {
        name: 'vectrys-store',
        // Ne persister que certains champs
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
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
    setCheckoutChecklist: s.setCheckoutChecklist,
  }));

export const useServices = () =>
  useStore((s) => ({
    catalog: s.catalog,
    cart: s.cart,
    orders: s.orders,
    isLoading: s.isLoadingServices,
    cartTotal: s.cart.reduce((sum, c) => sum + c.service.price * c.quantity, 0),
    cartCount: s.cart.reduce((sum, c) => sum + c.quantity, 0),
    paymentClientSecret: s.paymentClientSecret,
    pendingOrderId: s.pendingOrderId,
    unreadMessageCount: s.unreadMessageCount,
    pendingOrderCount: s.pendingOrderCount,
    fetchCatalog: s.fetchCatalog,
    addToCart: s.addToCart,
    removeFromCart: s.removeFromCart,
    updateCartQuantity: s.updateCartQuantity,
    clearCart: s.clearCart,
    placeOrder: s.placeOrder,
    confirmPayment: s.confirmPayment,
    clearPayment: s.clearPayment,
    fetchOrders: s.fetchOrders,
    cancelOrder: s.cancelOrder,
    fetchUnreadCounts: s.fetchUnreadCounts,
  }));

export const useChat = () =>
  useStore((s) => ({
    messages: s.messages,
    isTyping: s.isTyping,
    hostOnline: s.hostOnline,
    hostStatus: s.hostStatus,
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

export const useSubscription = () =>
  useStore((s) => ({
    plans: s.plans,
    subscription: s.subscription,
    isLoadingSubscription: s.isLoadingSubscription,
    fetchPlans: s.fetchPlans,
    fetchSubscription: s.fetchSubscription,
    startCheckout: s.startCheckout,
    openPortal: s.openPortal,
    startTrial: s.startTrial,
  }));

// ═══════════════════════════════════════════════════════════════
// EMPLOYEE DASHBOARD STORE (separate from guest portal)
// ═══════════════════════════════════════════════════════════════

interface Employee {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  active?: boolean;
  avatar_url?: string | null;
  temp_password?: boolean;
  nda_accepted_at?: string | null;
  last_login?: string;
  work_schedule_start?: string;
  work_schedule_end?: string;
}

interface EmployeeSession {
  id: string;
  employee_id: string;
  login_at: string;
  logout_at?: string | null;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  outside_schedule: boolean;
  employee?: Partial<Employee>;
}

interface OtpPending {
  employeeId: string;
  email: string; // masked email
}

interface Prospect {
  id: string;
  employee_id: string;
  company_name: string;
  contact_name?: string;
  contact_role?: string;
  phone?: string;
  email?: string;
  status: string;
  fate_profile?: string;
  interlocutor_type?: string;
  notes?: string;
  last_contact?: string;
  next_action?: string;
  next_action_date?: string;
  created_at: string;
  updated_at: string;
  employee?: Partial<Employee>;
  _count?: { call_sessions: number };
}

interface EmployeeNote {
  id: string;
  employee_id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface EmployeeTask {
  id: string;
  employee_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  employee?: Partial<Employee>;
}

interface ScreenshotAlert {
  id: string;
  employee_id: string;
  screenshot: string;
  page_url: string;
  page_title: string;
  context_summary: string;
  detection_method: string;
  severity: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
  employee?: Partial<Employee>;
}

interface EmployeeStoreState {
  employee: Employee | null;
  isEmployeeAuthenticated: boolean;
  isEmployeeLoading: boolean;
  employeeError: string | null;
  otpPending: OtpPending | null;
  prospects: Prospect[];
  notes: EmployeeNote[];
  tasks: EmployeeTask[];
  team: Employee[];
  sessions: EmployeeSession[];
  screenshotAlerts: ScreenshotAlert[];
  unreadAlertCount: number;
}

interface EmployeeStoreActions {
  employeeLogin: (matricule: string, password: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  cancelOtp: () => void;
  employeeLogout: () => void;
  fetchEmployeeMe: () => Promise<void>;
  acceptNda: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  registerEmployee: (data: { firstName: string; lastName: string; email: string; role?: string; workScheduleStart?: string; workScheduleEnd?: string }) => Promise<any>;
  clearEmployeeError: () => void;
  fetchProspects: (params?: { status?: string; search?: string }) => Promise<void>;
  createProspect: (data: Record<string, unknown>) => Promise<void>;
  updateProspect: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  fetchNotes: (params?: { category?: string; search?: string }) => Promise<void>;
  createNote: (data: { title: string; content: string; category?: string; pinned?: boolean }) => Promise<void>;
  updateNote: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  fetchTasks: (params?: { status?: string; priority?: string }) => Promise<void>;
  createTask: (data: Record<string, unknown>) => Promise<void>;
  updateTask: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  fetchTeam: () => Promise<void>;
  fetchSessions: (params?: { date?: string; employee_id?: string }) => Promise<void>;
  fetchSessionsToday: () => Promise<void>;
  fetchScreenshotAlerts: (params?: { acknowledged?: string }) => Promise<void>;
  fetchUnreadAlertCount: () => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeStoreState & EmployeeStoreActions>()(
  devtools(
    persist(
      (set, get) => ({
        employee: null,
        isEmployeeAuthenticated: false,
        isEmployeeLoading: false,
        employeeError: null,
        otpPending: null,
        prospects: [],
        notes: [],
        tasks: [],
        team: [],
        sessions: [],
        screenshotAlerts: [],
        unreadAlertCount: 0,

        // Step 1: credentials → OTP sent to email
        employeeLogin: async (matricule, password) => {
          set({ isEmployeeLoading: true, employeeError: null, otpPending: null });
          try {
            const res = await employeeApi.login(matricule, password);
            const data = res.data.data;

            if (data.requiresOtp) {
              set({
                otpPending: { employeeId: data.employeeId, email: data.email },
                isEmployeeLoading: false,
              });
            } else {
              // Fallback for non-2FA (shouldn't happen but safety)
              const { tokens, employee } = data;
              employeeTokenManager.setTokens(tokens);
              set({ employee, isEmployeeAuthenticated: true, isEmployeeLoading: false });
            }
          } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Erreur de connexion';
            set({ employeeError: msg, isEmployeeLoading: false });
            throw err;
          }
        },

        // Step 2: verify OTP → receive tokens
        verifyOtp: async (code) => {
          const { otpPending } = get();
          if (!otpPending) throw new Error('Aucune verification OTP en attente');

          set({ isEmployeeLoading: true, employeeError: null });
          try {
            const res = await employeeApi.verifyOtp(otpPending.employeeId, code);
            const { tokens, employee } = res.data.data;
            employeeTokenManager.setTokens(tokens);
            set({ employee, isEmployeeAuthenticated: true, isEmployeeLoading: false, otpPending: null });
          } catch (err: any) {
            const msg = err?.response?.data?.error || err?.message || 'Code OTP invalide';
            set({ employeeError: msg, isEmployeeLoading: false });
            throw err;
          }
        },

        cancelOtp: () => {
          set({ otpPending: null, employeeError: null });
        },

        employeeLogout: () => {
          // Best-effort logout session tracking
          employeeApi.logoutSession().catch(() => {});
          employeeTokenManager.clearTokens();
          set({
            employee: null,
            isEmployeeAuthenticated: false,
            otpPending: null,
            prospects: [],
            notes: [],
            tasks: [],
            team: [],
            sessions: [],
          });
        },

        fetchEmployeeMe: async () => {
          try {
            const res = await employeeApi.getMe();
            set({ employee: res.data.data, isEmployeeAuthenticated: true });
          } catch {
            set({ isEmployeeAuthenticated: false, employee: null });
          }
        },

        acceptNda: async () => {
          const res = await employeeApi.acceptNda();
          set({ employee: res.data.data });
        },

        changePassword: async (currentPassword, newPassword) => {
          await employeeApi.changePassword(currentPassword, newPassword);
          const emp = get().employee;
          if (emp) set({ employee: { ...emp, temp_password: false } });
        },

        forgotPassword: async (email) => {
          await employeeApi.forgotPassword(email);
        },

        resetPassword: async (email, code, newPassword) => {
          await employeeApi.resetPassword(email, code, newPassword);
        },

        uploadAvatar: async (file) => {
          const res = await employeeApi.uploadAvatar(file);
          const emp = get().employee;
          if (emp) set({ employee: { ...emp, avatar_url: res.data.data.avatar_url } });
        },

        removeAvatar: async () => {
          await employeeApi.removeAvatar();
          const emp = get().employee;
          if (emp) set({ employee: { ...emp, avatar_url: null } });
        },

        registerEmployee: async (data) => {
          const res = await employeeApi.register(data);
          return res.data.data;
        },

        clearEmployeeError: () => set({ employeeError: null }),

        // Prospects
        fetchProspects: async (params) => {
          try {
            const res = await employeeApi.getProspects(params);
            set({ prospects: res.data.data });
          } catch { /* silent */ }
        },
        createProspect: async (data) => {
          const res = await employeeApi.createProspect(data);
          set({ prospects: [res.data.data, ...get().prospects] });
        },
        updateProspect: async (id, data) => {
          const res = await employeeApi.updateProspect(id, data);
          set({ prospects: get().prospects.map(p => p.id === id ? res.data.data : p) });
        },
        deleteProspect: async (id) => {
          await employeeApi.deleteProspect(id);
          set({ prospects: get().prospects.filter(p => p.id !== id) });
        },

        // Notes
        fetchNotes: async (params) => {
          try {
            const res = await employeeApi.getNotes(params);
            set({ notes: res.data.data });
          } catch { /* silent */ }
        },
        createNote: async (data) => {
          const res = await employeeApi.createNote(data);
          set({ notes: [res.data.data, ...get().notes] });
        },
        updateNote: async (id, data) => {
          const res = await employeeApi.updateNote(id, data);
          set({ notes: get().notes.map(n => n.id === id ? res.data.data : n) });
        },
        deleteNote: async (id) => {
          await employeeApi.deleteNote(id);
          set({ notes: get().notes.filter(n => n.id !== id) });
        },

        // Tasks
        fetchTasks: async (params) => {
          try {
            const res = await employeeApi.getTasks(params);
            set({ tasks: res.data.data });
          } catch { /* silent */ }
        },
        createTask: async (data) => {
          const res = await employeeApi.createTask(data);
          set({ tasks: [res.data.data, ...get().tasks] });
        },
        updateTask: async (id, data) => {
          const res = await employeeApi.updateTask(id, data);
          set({ tasks: get().tasks.map(t => t.id === id ? res.data.data : t) });
        },
        deleteTask: async (id) => {
          await employeeApi.deleteTask(id);
          set({ tasks: get().tasks.filter(t => t.id !== id) });
        },

        // Team
        fetchTeam: async () => {
          try {
            const res = await employeeApi.getTeam();
            set({ team: res.data.data });
          } catch { /* silent */ }
        },

        // Sessions (CEO)
        fetchSessions: async (params) => {
          try {
            const res = await employeeApi.getSessions(params);
            set({ sessions: res.data.data });
          } catch { /* silent */ }
        },
        fetchSessionsToday: async () => {
          try {
            const res = await employeeApi.getSessionsToday();
            set({ sessions: res.data.data.sessions });
          } catch { /* silent */ }
        },

        // Screenshot Alerts (CEO)
        fetchScreenshotAlerts: async (params) => {
          try {
            const res = await employeeApi.getScreenshotAlerts(params);
            set({ screenshotAlerts: res.data.data });
          } catch { /* silent */ }
        },
        fetchUnreadAlertCount: async () => {
          try {
            const res = await employeeApi.getScreenshotAlertCount();
            set({ unreadAlertCount: res.data.data.count });
          } catch { /* silent */ }
        },
        acknowledgeAlert: async (id) => {
          const res = await employeeApi.acknowledgeScreenshotAlert(id);
          set({
            screenshotAlerts: get().screenshotAlerts.map(a => a.id === id ? res.data.data : a),
            unreadAlertCount: Math.max(0, get().unreadAlertCount - 1),
          });
        },
      }),
      {
        name: 'vectrys-employee-store',
        partialize: (state) => ({
          employee: state.employee,
          isEmployeeAuthenticated: state.isEmployeeAuthenticated,
        }),
      }
    ),
    { name: 'EmployeeStore' }
  )
);

// Auto-logout on 401
setOnEmployeeUnauthorized(() => {
  useEmployeeStore.getState().employeeLogout();
});
