// ============================================================
// VECTRYS — WebSocket Client (Socket.io)
// Chat temps réel avec reconnexion automatique
// ============================================================

import { io, Socket } from 'socket.io-client';
import { tokenManager } from './client';
import type { ChatMessage, WsTypingEvent, WsPresenceEvent } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

// ─── WEBSOCKET CLIENT CLASS ──────────────────────────────────

class WebSocketClient {
  private socket: Socket | null = null;
  private reservationId: string | null = null;
  private eventHandlers: Map<string, Function> = new Map();

  /**
   * Se connecter au WebSocket pour une réservation
   */
  connect(reservationId: string): void {
    if (this.socket?.connected && this.reservationId === reservationId) {
      console.log('[WS] Déjà connecté pour cette réservation');
      return;
    }

    // Disconnect previous if any
    this.disconnect();

    this.reservationId = reservationId;
    const token = tokenManager.getAccessToken();

    this.socket = io(WS_URL, {
      auth: { token },
      query: { reservation_id: reservationId },
      transports: ['websocket', 'polling'], // Fallback to polling if WS fails
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupEventListeners();

    console.log(`[WS] Connexion à ${WS_URL} pour réservation ${reservationId}`);
  }

  /**
   * Configurer les event listeners Socket.io
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // ─── Connexion réussie ───
    this.socket.on('connect', () => {
      console.log('[WS] Connecté', this.socket?.id);
    });

    // ─── Erreur de connexion ───
    this.socket.on('connect_error', (error) => {
      console.error('[WS] Erreur connexion', error.message);
      this.callHandler('onError', error);
    });

    // ─── Reconnexion ───
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[WS] Reconnecté après ${attemptNumber} tentatives`);
    });

    // ─── Déconnexion ───
    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Déconnecté', reason);
    });

    // ─── MESSAGE REÇU ───
    this.socket.on('message', (message: ChatMessage) => {
      console.log('[WS] Message reçu', message);
      this.callHandler('onMessage', message);
    });

    // ─── TYPING INDICATOR ───
    this.socket.on('typing', (data: WsTypingEvent) => {
      console.log('[WS] Typing', data);
      this.callHandler('onTyping', data);
    });

    // ─── PRESENCE (online/offline) ───
    this.socket.on('presence', (data: WsPresenceEvent) => {
      console.log('[WS] Presence', data);
      this.callHandler('onPresence', data);
    });

    // ─── ERREUR GÉNÉRIQUE ───
    this.socket.on('error', (error: any) => {
      console.error('[WS] Erreur', error);
      this.callHandler('onError', error);
    });
  }

  /**
   * Envoyer un message via WebSocket
   */
  sendMessage(text: string): boolean {
    if (!this.socket?.connected) {
      console.warn('[WS] Non connecté, impossible d\'envoyer');
      return false;
    }

    this.socket.emit('message', {
      reservation_id: this.reservationId,
      text,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Envoyer un indicateur "en train d'écrire"
   */
  sendTyping(isTyping: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', {
      reservation_id: this.reservationId,
      from: 'guest',
      isTyping,
    });
  }

  /**
   * Déconnecter le WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WS] Déconnexion explicite');
      this.socket.disconnect();
      this.socket = null;
      this.reservationId = null;
      this.eventHandlers.clear();
    }
  }

  /**
   * Enregistrer un handler d'événement
   */
  on(event: 'onMessage' | 'onTyping' | 'onPresence' | 'onError', handler: Function): this {
    this.eventHandlers.set(event, handler);
    return this; // Permet le chaînage : wsClient.on('onMessage', ...).on('onTyping', ...)
  }

  /**
   * Supprimer un handler d'événement
   */
  off(event: string): void {
    this.eventHandlers.delete(event);
  }

  /**
   * Appeler un handler si enregistré
   */
  private callHandler(event: string, data: any): void {
    const handler = this.eventHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  /**
   * Vérifier si connecté
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// ─── SINGLETON EXPORT ────────────────────────────────────────

export const wsClient = new WebSocketClient();
