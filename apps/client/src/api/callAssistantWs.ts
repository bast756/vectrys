// ============================================================================
// VECTRYS — Call Assistant WebSocket Client
// Socket.IO client for /call-assistant namespace
// + Employee context (role, interlocutor, FATE)
// ============================================================================

import { io, Socket } from 'socket.io-client';
import { tokenManager } from './client';
import { employeeTokenManager } from './employeeApi';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// ─── TYPES ──────────────────────────────────────────────────

export interface TranscriptEvent {
  text: string;
  speaker: string;
  confidence?: number;
}

export interface SuggestionStartEvent {
  triggeredBy: string;
}

export interface SuggestionChunkEvent {
  text: string;
}

export interface SuggestionCompleteEvent {
  id: string;
  suggestion: string;
  sources: Array<{
    id: string;
    title: string;
    similarity: number;
    source_type: string;
  }> | null;
}

export interface SessionStartedEvent {
  sessionId: string;
}

export interface ErrorEvent {
  message: string;
}

export interface InterlocutorDetectedEvent {
  type: string;
}

type EventMap = {
  'transcript:interim': (data: TranscriptEvent) => void;
  'transcript:final': (data: TranscriptEvent) => void;
  'suggestion:start': (data: SuggestionStartEvent) => void;
  'suggestion:chunk': (data: SuggestionChunkEvent) => void;
  'suggestion:complete': (data: SuggestionCompleteEvent) => void;
  'session:started': (data: SessionStartedEvent) => void;
  'session:ended': (data: { sessionId: string }) => void;
  'interlocutor:detected': (data: InterlocutorDetectedEvent) => void;
  'error': (data: ErrorEvent) => void;
};

// ─── CLIENT CLASS ───────────────────────────────────────────

class CallAssistantWsClient {
  private socket: Socket | null = null;
  private handlers: Map<string, Function[]> = new Map();

  /**
   * Connect to the /call-assistant namespace
   */
  connect(): void {
    if (this.socket?.connected) return;

    this.disconnect();

    // Prefer employee token, fallback to guest token
    const token = employeeTokenManager.getAccessToken() || tokenManager.getAccessToken();

    this.socket = io(`${WS_URL}/call-assistant`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupEventListeners();
    console.log('[CallAssistant WS] Connecting...');
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[CallAssistant WS] Connected', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[CallAssistant WS] Connection error', error.message);
      this.emit('error', { message: error.message });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[CallAssistant WS] Disconnected', reason);
    });

    // Forward all events to registered handlers
    const events: (keyof EventMap)[] = [
      'transcript:interim',
      'transcript:final',
      'suggestion:start',
      'suggestion:chunk',
      'suggestion:complete',
      'session:started',
      'session:ended',
      'interlocutor:detected',
      'error',
    ];

    for (const event of events) {
      this.socket.on(event, (data: any) => {
        this.emit(event, data);
      });
    }
  }

  /**
   * Start a call assistant session with context
   */
  startSession(platform?: string, context?: { userRole?: string; interlocutorType?: string; fateProfile?: string }): void {
    this.socket?.emit('session:start', {
      userId: 'founder',
      platform,
      ...(context || {}),
    });
  }

  /**
   * Update session context mid-call (interlocutor type, FATE profile)
   */
  updateContext(context: { interlocutorType?: string; fateProfile?: string }): void {
    this.socket?.emit('context:update', context);
  }

  /**
   * Send an audio chunk to Deepgram via the server
   */
  sendAudioChunk(data: ArrayBuffer): void {
    this.socket?.emit('audio:chunk', data);
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.socket?.emit('session:end');
  }

  /**
   * Disconnect the socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Register an event handler
   */
  on<K extends keyof EventMap>(event: K, handler: EventMap[K]): this {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler as Function);
    return this;
  }

  /**
   * Remove an event handler
   */
  off<K extends keyof EventMap>(event: K, handler?: EventMap[K]): void {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }
    const list = this.handlers.get(event);
    if (list) {
      const idx = list.indexOf(handler as Function);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  /**
   * Emit to local handlers
   */
  private emit(event: string, data: any): void {
    const list = this.handlers.get(event);
    if (list) {
      for (const handler of list) {
        handler(data);
      }
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// ─── SINGLETON EXPORT ───────────────────────────────────────

export const callAssistantWs = new CallAssistantWsClient();
