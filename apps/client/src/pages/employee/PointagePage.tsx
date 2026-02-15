import { useEffect, useState, useCallback } from 'react';
import { employeeApi } from '@/api/employeeApi';

interface PointageEntry {
  id: string;
  type: 'clock_in' | 'clock_out';
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  address: string | null;
  method: string;
  verified: boolean;
  notes: string | null;
  created_at: string;
}

interface PointageStatus {
  isClockedIn: boolean;
  lastEntry: PointageEntry | null;
  todayPointages: PointageEntry[];
  totalMinutesToday: number;
}

const DL = {
  void: '#05080d',
  obsidian: '#0d1220',
  surface: '#121828',
  elevated: '#171e34',
  gold400: '#d4a853',
  gold300: '#fcd34d',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  glassBorder: 'rgba(255,255,255,0.055)',
  gradientGold: 'linear-gradient(135deg, #d4a853 0%, #fcd34d 50%, #b8860b 100%)',
};

export default function PointagePage() {
  const [status, setStatus] = useState<PointageStatus | null>(null);
  const [history, setHistory] = useState<PointageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'acquiring' | 'success' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [tab, setTab] = useState<'today' | 'history'>('today');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await employeeApi.getPointageStatus();
      setStatus(res.data.data);
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await employeeApi.getPointageHistory({ limit: '50' });
      setHistory(res.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStatus(), fetchHistory()]).finally(() => setIsLoading(false));
  }, [fetchStatus, fetchHistory]);

  const getGPSPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalisation non supportee par votre navigateur'));
        return;
      }
      setGpsStatus('acquiring');
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  };

  const handleClock = async (type: 'clock_in' | 'clock_out') => {
    setIsClocking(true);
    setGpsError(null);

    try {
      const position = await getGPSPosition();
      setGpsStatus('success');

      const data = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        method: 'gps',
      };

      if (type === 'clock_in') {
        await employeeApi.clockIn(data);
      } else {
        await employeeApi.clockOut(data);
      }

      await fetchStatus();
      await fetchHistory();
    } catch (err: any) {
      setGpsStatus('error');
      if (err.code === 1) {
        setGpsError('Acces a la localisation refuse. Veuillez activer la geolocalisation.');
      } else if (err.code === 2) {
        setGpsError('Position indisponible. Verifiez votre GPS.');
      } else if (err.code === 3) {
        setGpsError('Delai de localisation depasse. Reessayez.');
      } else {
        setGpsError(err.message || 'Erreur lors du pointage');
      }
    } finally {
      setIsClocking(false);
      setTimeout(() => setGpsStatus('idle'), 3000);
    }
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m.toString().padStart(2, '0')}`;
  };

  const formatHour = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      {/* Title */}
      <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 700, color: DL.textPrimary, marginBottom: 8 }}>
        Pointage
      </h1>
      <p style={{ fontSize: 13, color: DL.textMuted, marginBottom: 24 }}>
        Pointage geolocaise - Arrivee et depart
      </p>

      {isLoading ? (
        <div style={{ textAlign: 'center', color: DL.textSecondary, padding: 48 }}>Chargement...</div>
      ) : (
        <>
          {/* Clock Card */}
          <div style={{
            background: status?.isClockedIn
              ? 'linear-gradient(135deg, #064e3b 0%, #0d1220 100%)'
              : `linear-gradient(135deg, ${DL.elevated} 0%, ${DL.obsidian} 100%)`,
            borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 24,
            border: `1px solid ${DL.glassBorder}`,
          }}>
            {/* Current Time */}
            <p style={{ fontSize: 40, fontWeight: 700, color: DL.textPrimary, margin: '0 0 4px', fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p style={{ fontSize: 13, color: DL.textMuted, margin: '0 0 24px' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {/* Status */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px',
              borderRadius: 20, background: status?.isClockedIn ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
              marginBottom: 24,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: status?.isClockedIn ? '#22c55e' : '#ef4444' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: status?.isClockedIn ? '#22c55e' : '#ef4444' }}>
                {status?.isClockedIn ? 'En service' : 'Hors service'}
              </span>
            </div>

            {/* Today Total */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: DL.textMuted, margin: 0 }}>Temps travaille aujourd'hui</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: DL.gold400, margin: '4px 0 0' }}>
                {formatTime(status?.totalMinutesToday || 0)}
              </p>
            </div>

            {/* Clock Button */}
            <button
              onClick={() => handleClock(status?.isClockedIn ? 'clock_out' : 'clock_in')}
              disabled={isClocking}
              style={{
                width: 140, height: 140, borderRadius: '50%', border: 'none', cursor: isClocking ? 'default' : 'pointer',
                background: isClocking ? DL.elevated : status?.isClockedIn ? '#dc2626' : DL.gradientGold,
                color: status?.isClockedIn ? '#fff' : '#0f172a',
                fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                boxShadow: isClocking ? 'none' : '0 4px 20px rgba(212,168,83,0.3)',
                transition: 'all 0.3s',
              }}
            >
              {isClocking ? (
                <span style={{ fontSize: 13, color: DL.textSecondary }}>Localisation...</span>
              ) : status?.isClockedIn ? (
                <>
                  <span style={{ display: 'block', fontSize: 28, marginBottom: 4 }}>⏹</span>
                  Depart
                </>
              ) : (
                <>
                  <span style={{ display: 'block', fontSize: 28, marginBottom: 4 }}>▶</span>
                  Arrivee
                </>
              )}
            </button>

            {/* GPS Status */}
            {gpsStatus !== 'idle' && (
              <p style={{
                fontSize: 12, marginTop: 12,
                color: gpsStatus === 'success' ? '#22c55e' : gpsStatus === 'error' ? '#ef4444' : DL.textSecondary,
              }}>
                {gpsStatus === 'acquiring' && 'Acquisition GPS en cours...'}
                {gpsStatus === 'success' && 'Position GPS validee'}
                {gpsStatus === 'error' && (gpsError || 'Erreur GPS')}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['today', 'history'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 8,
                background: tab === t ? DL.elevated : 'transparent',
                color: tab === t ? DL.gold400 : DL.textMuted,
                fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {t === 'today' ? "Aujourd'hui" : 'Historique'}
              </button>
            ))}
          </div>

          {/* Today's entries */}
          {tab === 'today' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {(status?.todayPointages || []).length === 0 ? (
                <div style={{ textAlign: 'center', color: DL.textMuted, padding: 32, fontSize: 13 }}>
                  Aucun pointage aujourd'hui.
                </div>
              ) : (
                status!.todayPointages.map((p) => (
                  <div key={p.id} style={{
                    background: DL.elevated, borderRadius: 10, padding: '12px 16px',
                    border: `1px solid ${DL.glassBorder}`, display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: p.type === 'clock_in' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: p.type === 'clock_in' ? '#22c55e' : '#ef4444', fontSize: 16,
                    }}>
                      {p.type === 'clock_in' ? '▶' : '⏹'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: DL.textPrimary, margin: 0 }}>
                        {p.type === 'clock_in' ? 'Arrivee' : 'Depart'}
                      </p>
                      <p style={{ fontSize: 11, color: DL.textMuted, margin: '2px 0 0' }}>
                        {p.verified ? 'GPS verifie' : p.method === 'manual' ? 'Manuel' : 'GPS non verifie'}
                        {p.accuracy && ` (±${Math.round(p.accuracy)}m)`}
                      </p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: DL.textSecondary, fontFamily: 'monospace' }}>
                      {formatHour(p.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* History */}
          {tab === 'history' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', color: DL.textMuted, padding: 32, fontSize: 13 }}>
                  Aucun historique de pointage.
                </div>
              ) : (
                history.map((p, i) => {
                  const prevDate = i > 0 ? formatDate(history[i - 1].created_at) : null;
                  const currentDate = formatDate(p.created_at);
                  const showDateHeader = currentDate !== prevDate;

                  return (
                    <div key={p.id}>
                      {showDateHeader && (
                        <p style={{ fontSize: 12, fontWeight: 600, color: DL.gold400, margin: '12px 0 6px', textTransform: 'capitalize' }}>
                          {currentDate}
                        </p>
                      )}
                      <div style={{
                        background: DL.elevated, borderRadius: 10, padding: '10px 14px',
                        border: `1px solid ${DL.glassBorder}`, display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: p.type === 'clock_in' ? '#22c55e' : '#ef4444',
                        }} />
                        <span style={{ fontSize: 12, color: DL.textPrimary, flex: 1 }}>
                          {p.type === 'clock_in' ? 'Arrivee' : 'Depart'}
                        </span>
                        {p.verified && <span style={{ fontSize: 10, color: '#22c55e' }}>GPS</span>}
                        <span style={{ fontSize: 12, color: DL.textMuted, fontFamily: 'monospace' }}>
                          {formatHour(p.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
