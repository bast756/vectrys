// ============================================================
// VECTRYS — Custom React Hooks
// Data fetching, auth flow, chat, accessibility
// ============================================================

import { useEffect, useCallback, useRef, useState } from 'react';
import { useStore, useAuth, useBooking, useServices, useChat, useUI } from '@/store';
import { weatherApi, transportApi, aiApi, notificationsApi } from '@/api/endpoints';
import type { WeatherData, TransportOption, Notification, AIChatResponse } from '@/types';

// ─── useInitApp: Bootstrap complet au démarrage ──────────────

export function useInitApp() {
  const { isAuthenticated, fetchMe } = useAuth();
  const { fetchReservation } = useBooking();
  const { navigate } = useUI();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchMe();
        const state = useStore.getState();
        if (state.isAuthenticated) {
          await state.fetchReservation();
          navigate(state.termsAccepted ? 'home' : 'terms');
        } else {
          navigate('onboarding');
        }
      } catch {
        navigate('onboarding');
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  return { ready, isAuthenticated };
}

// ─── useWeather ──────────────────────────────────────────────

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reservation = useStore((s) => s.reservation);

  const fetch = useCallback(async () => {
    if (!reservation?.property_id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await weatherApi.getWeather(reservation.property_id);
      setData(data.data);
    } catch (err: any) {
      setError(err.message || 'Erreur météo');
    } finally {
      setLoading(false);
    }
  }, [reservation?.property_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { weather: data, loading, error, refresh: fetch };
}

// ─── useTransport ────────────────────────────────────────────

export function useTransport() {
  const [options, setOptions] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reservation = useStore((s) => s.reservation);

  useEffect(() => {
    if (!reservation?.property_id) return;
    setLoading(true);
    transportApi
      .getOptions(reservation.property_id)
      .then(({ data }) => setOptions(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reservation?.property_id]);

  return { options, loading, error };
}

// ─── useNotifications ────────────────────────────────────────

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getNotifications();
      setNotifications(data.data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { notifications, unreadCount, loading, markAsRead, refresh: fetch };
}

// ─── useAIChat: Chat avec l'assistant IA ─────────────────────

export function useAIChat() {
  const [response, setResponse] = useState<AIChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reservation = useStore((s) => s.reservation);

  const ask = useCallback(
    async (message: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await aiApi.chat(message, { reservation_id: reservation?.id });
        setResponse(data.data);
        return data.data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [reservation?.id]
  );

  const translate = useCallback(async (text: string, targetLang: string) => {
    try {
      const { data } = await aiApi.translate(text, targetLang);
      return data.data.translated_text;
    } catch {
      return null;
    }
  }, []);

  return { response, loading, error, ask, translate };
}

// ─── useDebounce ─────────────────────────────────────────────

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// ─── useOnlineStatus ─────────────────────────────────────────

export function useOnlineStatus() {
  const { isOffline, setOffline } = useUI();

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  return { isOffline };
}

// ─── usePullToRefresh ────────────────────────────────────────

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    async (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const distance = endY - startY.current;
      if (distance > 100 && window.scrollY === 0 && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    },
    [onRefresh, refreshing]
  );

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return { refreshing };
}

// ─── useAccessibility: TTS helper ────────────────────────────

export function useTTS() {
  const { accessibilitySettings, lang } = useUI();

  const speak = useCallback(
    (text: string) => {
      if (!accessibilitySettings.ttsEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-PT' : lang === 'ar' ? 'ar-SA' : lang === 'tr' ? 'tr-TR' : 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    },
    [accessibilitySettings.ttsEnabled, lang]
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, stop, enabled: accessibilitySettings.ttsEnabled };
}

// ─── Re-export convenience selectors ─────────────────────────

export { useAuth, useBooking, useServices, useChat, useUI };
