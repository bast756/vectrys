// ============================================================
// VECTRYS Integration Kit — Barrel Exports
// ============================================================
//
// Usage dans les composants React :
//
//   import { useAuth, useBooking, useServices, useChat, useUI } from '@/store';
//   import { useWeather, useTransport, useNotifications, useAIChat } from '@/hooks';
//   import { authApi, guestApi, servicesApi, chatApi, aiApi } from '@/api/endpoints';
//   import type { User, Reservation, Property, Service } from '@/types';
//
// ============================================================

// Types
export type * from './types';

// API
export { default as api, tokenManager, setOnUnauthorized } from './api/client';
export * from './api/endpoints';
export { wsClient } from './api/websocket';

// Store
export { useStore, useAuth, useBooking, useServices, useChat, useUI } from './store';

// Hooks
export {
  useInitApp,
  useWeather,
  useTransport,
  useNotifications,
  useAIChat,
  useDebounce,
  useOnlineStatus,
  usePullToRefresh,
  useTTS,
} from './hooks';
