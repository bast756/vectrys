// ============================================================================
// VECTRYS — Call Assistant Page ("Souffleur Intelligent")
// Full mode: 2-panel transcription + suggestions
// CEO Overlay mode: Compact floating panel (suggestions only), draggable
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { useEmployeeStore } from '@/store';
import {
  callAssistantWs,
  type TranscriptEvent,
  type SuggestionStartEvent,
  type SuggestionChunkEvent,
  type SuggestionCompleteEvent,
} from '@/api/callAssistantWs';

// ─── TYPES ──────────────────────────────────────────────────

interface TranscriptLine {
  id: string;
  text: string;
  speaker: string;
  isFinal: boolean;
  timestamp: number;
}

interface Suggestion {
  id: string;
  triggerText: string;
  text: string;
  isStreaming: boolean;
  sources: Array<{ id: string; title: string; similarity: number }> | null;
}

// ─── ACCESS CODE ────────────────────────────────────────────

const ACCESS_CODE = import.meta.env.VITE_CALL_ASSISTANT_ACCESS_CODE || 'Ub318246#';
const STORAGE_KEY = 'call_assistant_unlocked';

// ─── INTERLOCUTOR OPTIONS ───────────────────────────────────

const INTERLOCUTOR_TYPES = [
  { value: 'unknown', label: 'Auto-detect' },
  { value: 'journalist', label: 'Journaliste' },
  { value: 'investor', label: 'Investisseur' },
  { value: 'pdg', label: 'PDG/Decideur' },
  { value: 'prospect', label: 'Prospect' },
];

const FATE_PROFILES = [
  { value: '', label: 'Aucun' },
  { value: 'F', label: 'F (Focus)' },
  { value: 'A', label: 'A (Authority)' },
  { value: 'T', label: 'T (Tribe)' },
  { value: 'E', label: 'E (Emotion)' },
];

// ─── SECURITY BANNER ────────────────────────────────────────

function SecurityBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      padding: '10px 20px', background: 'rgba(212, 168, 83, 0.08)',
      borderBottom: '1px solid rgba(212, 168, 83, 0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ fontSize: 11, color: '#d4a853', lineHeight: 1.5 }}>
        <strong>VECTRYS — Outil Confidentiel</strong> &mdash;
        Donnees vocales et transcriptions traitees en temps reel sur serveurs securises (VPS Paris, TLS 1.3).
        Aucune donnee partagee avec des tiers. Conforme RGPD.
      </div>
      <button onClick={() => setDismissed(true)} style={{
        background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, marginLeft: 12,
      }}>&times;</button>
    </div>
  );
}

// ─── ACCESS GATE COMPONENT ─────────────────────────────────

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      onUnlock();
    } else {
      setCodeError(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1e293b', borderRadius: 16, padding: 40, width: 360, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' }}>Souffleur Intelligent</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>Entrez le code d'acces</p>
        <input
          type="password"
          value={code}
          onChange={(e) => { setCode(e.target.value); setCodeError(false); }}
          placeholder="Code d'acces"
          autoFocus
          style={{
            width: '100%', padding: '12px 16px', background: '#0f172a', border: `1px solid ${codeError ? '#ef4444' : '#334155'}`,
            borderRadius: 8, color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12,
          }}
        />
        {codeError && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>Code incorrect</p>}
        <button type="submit" style={{
          width: '100%', padding: '12px 0', background: '#2563eb', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Acceder
        </button>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CEO OVERLAY MODE — Compact floating panel, suggestions only
// ═══════════════════════════════════════════════════════════════

function CeoOverlayPanel({
  suggestions,
  isActive,
  elapsed,
  onStop,
  onStart,
  onCopy,
  copied,
  onSwitchToFull,
  interlocutorType,
  fateProfile,
  onInterlocutorChange,
  onFateChange,
  audioError,
}: {
  suggestions: Suggestion[];
  isActive: boolean;
  elapsed: number;
  onStop: () => void;
  onStart: (source: 'screen' | 'mic') => void;
  onCopy: (text: string, id: string) => void;
  copied: string | null;
  onSwitchToFull: () => void;
  interlocutorType: string;
  fateProfile: string;
  onInterlocutorChange: (v: string) => void;
  onFateChange: (v: string) => void;
  audioError: string | null;
}) {
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const suggestionsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll suggestions
  useEffect(() => {
    suggestionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [suggestions]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, select, input')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 360, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div
      ref={panelRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed', left: position.x, top: position.y, zIndex: 99999,
        width: 360,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(212, 168, 83, 0.2)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#e2e8f0',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
        transition: isDragging ? 'none' : 'box-shadow 0.2s',
      }}
    >
      {/* Overlay Header — always visible, draggable */}
      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
        cursor: 'grab',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 2,
            background: 'linear-gradient(135deg, #d4a853, #fcd34d)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>SOUFFLEUR</span>
          {isActive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444', borderRadius: 10, fontSize: 9, fontWeight: 700,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              {formatTime(elapsed)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Agrandir' : 'Reduire'}
            style={{ ...overlayBtnStyle, fontSize: 14, padding: '2px 6px' }}>
            {collapsed ? '+' : '−'}
          </button>
          <button onClick={onSwitchToFull} title="Mode complet"
            style={{ ...overlayBtnStyle, fontSize: 10, padding: '3px 8px' }}>
            Plein
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Controls row */}
          <div style={{
            padding: '8px 14px', display: 'flex', gap: 6, alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <select value={interlocutorType} onChange={e => onInterlocutorChange(e.target.value)}
              style={overlaySelectStyle}>
              {INTERLOCUTOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={fateProfile} onChange={e => onFateChange(e.target.value)}
              style={overlaySelectStyle}>
              {FATE_PROFILES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            {!isActive ? (
              <>
                <button onClick={() => onStart('screen')} style={overlayStartBtn}>Ecran</button>
                <button onClick={() => onStart('mic')} style={overlayStartBtnAlt}>Micro</button>
              </>
            ) : (
              <button onClick={onStop} style={overlayStopBtn}>Stop</button>
            )}
          </div>

          {/* Audio error */}
          {audioError && (
            <div style={{ padding: '6px 14px', fontSize: 11, color: '#fca5a5', background: 'rgba(127, 29, 29, 0.3)' }}>
              {audioError}
            </div>
          )}

          {/* Suggestions area — compact, scrollable */}
          <div style={{
            maxHeight: 340, overflowY: 'auto', padding: '8px 14px 12px',
          }}>
            {suggestions.length === 0 && (
              <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '20px 10px', margin: 0 }}>
                {isActive ? 'En ecoute... les suggestions apparaitront ici' : 'Activez le souffleur pour demarrer'}
              </p>
            )}
            {suggestions.map((s) => (
              <div key={s.id} style={{
                background: 'rgba(30, 41, 59, 0.6)', borderRadius: 10,
                padding: 12, marginBottom: 8, border: '1px solid rgba(51, 65, 85, 0.4)',
              }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginBottom: 6 }}>
                  "{s.triggerText}"
                </div>
                <div style={{
                  fontSize: 13, lineHeight: 1.6, color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                }}>
                  {s.text}
                  {s.isStreaming && <span style={{ color: '#d4a853', animation: 'blink 0.8s infinite' }}>|</span>}
                </div>
                {s.sources && s.sources.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 10, color: '#64748b' }}>
                    {s.sources.map(src => src.title.substring(0, 25)).join(' / ')}
                  </div>
                )}
                {!s.isStreaming && (
                  <button onClick={() => onCopy(s.text, s.id)} style={{
                    marginTop: 6, padding: '3px 10px', background: 'rgba(212, 168, 83, 0.1)',
                    color: '#d4a853', border: '1px solid rgba(212, 168, 83, 0.25)',
                    borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  }}>
                    {copied === s.id ? 'Copie !' : 'Copier'}
                  </button>
                )}
              </div>
            ))}
            <div ref={suggestionsEndRef} />
          </div>
        </>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

const overlayBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 5, color: '#94a3b8', cursor: 'pointer', fontFamily: 'system-ui',
};

const overlaySelectStyle: React.CSSProperties = {
  padding: '4px 6px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(51, 65, 85, 0.5)',
  borderRadius: 5, color: '#e2e8f0', fontSize: 10, outline: 'none',
};

const overlayStartBtn: React.CSSProperties = {
  padding: '4px 10px', background: '#2563eb', color: '#fff', border: 'none',
  borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
};

const overlayStartBtnAlt: React.CSSProperties = {
  padding: '4px 10px', background: 'transparent', color: '#2563eb',
  border: '1px solid #2563eb', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
};

const overlayStopBtn: React.CSSProperties = {
  padding: '4px 10px', background: '#ef4444', color: '#fff', border: 'none',
  borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer',
};

// ═══════════════════════════════════════════════════════════════
// MAIN ASSISTANT COMPONENT
// ═══════════════════════════════════════════════════════════════

function CallAssistantApp() {
  const navigate = useNavigate();
  const { employee } = useEmployeeStore();

  // State
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [interimText, setInterimText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [interlocutorType, setInterlocutorType] = useState('unknown');
  const [fateProfile, setFateProfile] = useState('');
  const [detectedType, setDetectedType] = useState<string | null>(null);

  // CEO overlay mode
  const isCeo = employee?.role === 'ceo';
  const [overlayMode, setOverlayMode] = useState(false);

  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const suggestionsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio capture
  const onAudioChunk = useCallback((data: ArrayBuffer) => {
    callAssistantWs.sendAudioChunk(data);
  }, []);

  const audio = useAudioCapture(onAudioChunk);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimText]);

  // Auto-scroll suggestions
  useEffect(() => {
    suggestionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [suggestions]);

  // Timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  // WebSocket event handlers
  useEffect(() => {
    callAssistantWs.on('session:started', () => {
      setIsActive(true);
    });

    callAssistantWs.on('transcript:interim', (data: TranscriptEvent) => {
      setInterimText(data.text);
    });

    callAssistantWs.on('transcript:final', (data: TranscriptEvent) => {
      setInterimText('');
      setTranscripts(prev => [
        ...prev,
        {
          id: `t-${Date.now()}`,
          text: data.text,
          speaker: data.speaker,
          isFinal: true,
          timestamp: Date.now(),
        },
      ]);
    });

    callAssistantWs.on('suggestion:start', (data: SuggestionStartEvent) => {
      setSuggestions(prev => [
        ...prev,
        {
          id: `s-${Date.now()}`,
          triggerText: data.triggeredBy,
          text: '',
          isStreaming: true,
          sources: null,
        },
      ]);
    });

    callAssistantWs.on('suggestion:chunk', (data: SuggestionChunkEvent) => {
      setSuggestions(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.isStreaming) {
          updated[updated.length - 1] = { ...last, text: last.text + data.text };
        }
        return updated;
      });
    });

    callAssistantWs.on('suggestion:complete', (data: SuggestionCompleteEvent) => {
      setSuggestions(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.isStreaming) {
          updated[updated.length - 1] = {
            ...last,
            id: data.id,
            text: data.suggestion,
            isStreaming: false,
            sources: data.sources,
          };
        }
        return updated;
      });
    });

    callAssistantWs.on('session:ended', () => {
      setIsActive(false);
    });

    callAssistantWs.on('error', (data) => {
      console.error('[CallAssistant UI] Error:', data.message);
    });

    callAssistantWs.on('interlocutor:detected' as any, (data: { type: string }) => {
      if (interlocutorType === 'unknown') {
        setDetectedType(data.type);
      }
    });

    return () => {
      callAssistantWs.off('session:started');
      callAssistantWs.off('transcript:interim');
      callAssistantWs.off('transcript:final');
      callAssistantWs.off('suggestion:start');
      callAssistantWs.off('suggestion:chunk');
      callAssistantWs.off('suggestion:complete');
      callAssistantWs.off('session:ended');
      callAssistantWs.off('error');
      callAssistantWs.off('interlocutor:detected' as any);
    };
  }, [interlocutorType]);

  // ─── ACTIONS ────────────────────────────────────────────────

  const handleStart = async (source: 'screen' | 'mic') => {
    callAssistantWs.connect();

    setTimeout(() => {
      callAssistantWs.startSession('meet', {
        userRole: employee?.role || 'employee',
        interlocutorType,
        fateProfile,
      });

      if (source === 'screen') {
        audio.startScreenCapture();
      } else {
        audio.startMicCapture();
      }
    }, 500);

    setElapsed(0);
    setTranscripts([]);
    setSuggestions([]);
    setInterimText('');
    setDetectedType(null);
  };

  const handleStop = () => {
    audio.stopCapture();
    callAssistantWs.endSession();
    setIsActive(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInterlocutorChange = (type: string) => {
    setInterlocutorType(type);
    if (isActive) {
      callAssistantWs.updateContext({ interlocutorType: type });
    }
  };

  const handleFateChange = (profile: string) => {
    setFateProfile(profile);
    if (isActive) {
      callAssistantWs.updateContext({ fateProfile: profile });
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── CEO OVERLAY RENDER ───────────────────────────────────

  if (overlayMode) {
    return (
      <CeoOverlayPanel
        suggestions={suggestions}
        isActive={isActive}
        elapsed={elapsed}
        onStop={handleStop}
        onStart={handleStart}
        onCopy={handleCopy}
        copied={copied}
        onSwitchToFull={() => setOverlayMode(false)}
        interlocutorType={interlocutorType}
        fateProfile={fateProfile}
        onInterlocutorChange={handleInterlocutorChange}
        onFateChange={handleFateChange}
        audioError={audio.error}
      />
    );
  }

  // ─── FULL MODE RENDER ─────────────────────────────────────

  return (
    <div style={styles.container}>
      {/* Security banner */}
      <SecurityBanner />

      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            &larr;
          </button>
          <h1 style={styles.title}>Souffleur Intelligent</h1>
          {isActive && (
            <span style={styles.liveBadge}>
              <span style={styles.liveDot} /> LIVE
            </span>
          )}
          {detectedType && interlocutorType === 'unknown' && (
            <span style={{
              ...styles.liveBadge,
              background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4',
            }}>
              Detecte: {INTERLOCUTOR_TYPES.find(t => t.value === detectedType)?.label || detectedType}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Interlocutor selector */}
          <select value={interlocutorType} onChange={e => handleInterlocutorChange(e.target.value)}
            style={{
              padding: '6px 10px', background: '#1e293b', border: '1px solid #334155',
              borderRadius: 6, color: '#e2e8f0', fontSize: 11,
            }}>
            {INTERLOCUTOR_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* FATE profile selector */}
          <select value={fateProfile} onChange={e => handleFateChange(e.target.value)}
            style={{
              padding: '6px 10px', background: '#1e293b', border: '1px solid #334155',
              borderRadius: 6, color: '#e2e8f0', fontSize: 11,
            }}>
            {FATE_PROFILES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {isActive && (
            <span style={styles.timer}>{formatTime(elapsed)}</span>
          )}

          {/* CEO overlay toggle */}
          {isCeo && (
            <button onClick={() => setOverlayMode(true)} title="Mode discret — Fenetre flottante"
              style={{
                padding: '6px 12px', background: 'rgba(212, 168, 83, 0.1)',
                color: '#d4a853', border: '1px solid rgba(212, 168, 83, 0.3)',
                borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'system-ui',
              }}>
              Mode Discret
            </button>
          )}

          {!isActive ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => handleStart('screen')} style={styles.startBtn}>
                Partage ecran
              </button>
              <button onClick={() => handleStart('mic')} style={styles.startBtnAlt}>
                Micro
              </button>
            </div>
          ) : (
            <button onClick={handleStop} style={styles.stopBtn}>
              Arreter
            </button>
          )}
        </div>
      </header>

      {/* Audio error */}
      {audio.error && (
        <div style={styles.errorBar}>
          {audio.error}
        </div>
      )}

      {/* Main content */}
      <div style={styles.main}>
        {/* Left: Transcription */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Transcription</h2>
          <div style={styles.panelContent}>
            {transcripts.length === 0 && !interimText && (
              <p style={styles.emptyText}>
                {isActive
                  ? 'En attente de parole...'
                  : 'Demarrez une session pour commencer la transcription'}
              </p>
            )}
            {transcripts.map((t) => (
              <div key={t.id} style={styles.transcriptLine}>
                <span style={styles.speaker}>
                  {t.speaker === 'me' ? 'Moi' : t.speaker === 'guest' ? 'Interlocuteur' : 'Inconnu'}
                </span>
                <span style={styles.transcriptText}>{t.text}</span>
              </div>
            ))}
            {interimText && (
              <div style={{ ...styles.transcriptLine, opacity: 0.5 }}>
                <span style={styles.speaker}>...</span>
                <span style={styles.transcriptText}>{interimText}</span>
              </div>
            )}
            <div ref={transcriptsEndRef} />
          </div>
        </div>

        {/* Right: Suggestions */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Suggestions IA</h2>
          <div style={styles.panelContent}>
            {suggestions.length === 0 && (
              <p style={styles.emptyText}>
                {isActive
                  ? 'Les suggestions apparaitront quand une question est detectee'
                  : 'Les suggestions IA apparaitront ici'}
              </p>
            )}
            {suggestions.map((s) => (
              <div key={s.id} style={styles.suggestionCard}>
                <div style={styles.suggestionTrigger}>
                  Question: "{s.triggerText}"
                </div>
                <div style={styles.suggestionText}>
                  {s.text}
                  {s.isStreaming && <span style={styles.cursor}>|</span>}
                </div>
                {s.sources && s.sources.length > 0 && (
                  <div style={styles.sourcesBar}>
                    Sources: {s.sources.map((src, i) => (
                      <span key={src.id} style={styles.sourceTag}>
                        {src.title.substring(0, 30)}{src.title.length > 30 ? '...' : ''}
                        {i < s.sources!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
                {!s.isStreaming && (
                  <button
                    onClick={() => handleCopy(s.text, s.id)}
                    style={styles.copyBtn}
                  >
                    {copied === s.id ? 'Copie !' : 'Copier'}
                  </button>
                )}
              </div>
            ))}
            <div ref={suggestionsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE WRAPPER (with access gate) ────────────────────────

export default function CallAssistantPage() {
  const { isEmployeeAuthenticated } = useEmployeeStore();

  const [unlocked, setUnlocked] = useState(() =>
    isEmployeeAuthenticated || sessionStorage.getItem(STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    if (isEmployeeAuthenticated) setUnlocked(true);
  }, [isEmployeeAuthenticated]);

  if (!unlocked) {
    return <AccessGate onUnlock={() => setUnlocked(true)} />;
  }

  return <CallAssistantApp />;
}

// ─── STYLES ─────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #1e293b',
    background: '#0f172a',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: 18,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#ef4444',
    display: 'inline-block',
  },
  timer: {
    fontSize: 14,
    color: '#94a3b8',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'monospace',
  },
  startBtn: {
    padding: '8px 16px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  startBtnAlt: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  stopBtn: {
    padding: '8px 16px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBar: {
    padding: '8px 20px',
    background: '#7f1d1d',
    color: '#fca5a5',
    fontSize: 13,
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    background: '#1e293b',
    minHeight: 0,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    background: '#0f172a',
    minHeight: 0,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding: '12px 16px 8px',
    margin: 0,
  },
  panelContent: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '0 16px 16px',
  },
  emptyText: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  transcriptLine: {
    padding: '6px 0',
    borderBottom: '1px solid rgba(30, 41, 59, 0.5)',
    fontSize: 13,
    lineHeight: 1.5,
  },
  speaker: {
    color: '#3b82f6',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase' as const,
    marginRight: 8,
  },
  transcriptText: {
    color: '#cbd5e1',
  },
  suggestionCard: {
    background: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    border: '1px solid #334155',
  },
  suggestionTrigger: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic' as const,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #334155',
  },
  suggestionText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap' as const,
  },
  cursor: {
    color: '#3b82f6',
  },
  sourcesBar: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: '1px solid #334155',
    fontSize: 11,
    color: '#64748b',
  },
  sourceTag: {
    color: '#94a3b8',
  },
  copyBtn: {
    marginTop: 8,
    padding: '4px 12px',
    background: 'rgba(37, 99, 235, 0.1)',
    color: '#60a5fa',
    border: '1px solid rgba(37, 99, 235, 0.3)',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
