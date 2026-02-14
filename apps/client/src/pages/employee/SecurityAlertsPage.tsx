// ============================================================================
// VECTRYS — Security Alerts Page (CEO Only)
// Shows screenshot capture attempts with employee info, preview, context
// ============================================================================

import { useEffect, useState } from 'react';
import { useEmployeeStore } from '@/store';

const DL = {
  void: '#05080d', obsidian: '#0d1220', surface: '#121828', elevated: '#171e34',
  glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const METHOD_LABELS: Record<string, string> = {
  keydown: 'Raccourci clavier (PrintScreen / Cmd+Shift)',
  visibility_change: 'Changement de visibilite (capture probable)',
  devtools: 'Outils developpeur ouverts',
};

export default function SecurityAlertsPage() {
  const { employee, screenshotAlerts, fetchScreenshotAlerts, acknowledgeAlert, fetchUnreadAlertCount } = useEmployeeStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isCEO = employee?.role === 'ceo';

  useEffect(() => {
    if (isCEO) {
      const params = filter === 'unread' ? { acknowledged: 'false' } : filter === 'acknowledged' ? { acknowledged: 'true' } : undefined;
      fetchScreenshotAlerts(params);
    }
  }, [filter]);

  if (!isCEO) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: DL.text.muted }}>
        Acces reserve au CEO.
      </div>
    );
  }

  const handleAcknowledge = async (id: string) => {
    await acknowledgeAlert(id);
    fetchUnreadAlertCount();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: DL.text.primary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Alertes de Securite
          </h1>
          <p style={{ fontSize: 13, color: DL.text.muted, margin: '4px 0 0' }}>
            Tentatives de capture d'ecran detectees sur l'espace employe
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'unread', 'acknowledged'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: filter === f ? 600 : 400,
              background: filter === f ? `${DL.gold400}15` : 'transparent',
              color: filter === f ? DL.gold400 : DL.text.muted,
              border: `1px solid ${filter === f ? `${DL.gold400}30` : DL.glassBorder}`,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {f === 'all' ? 'Toutes' : f === 'unread' ? 'Non lues' : 'Traitees'}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {screenshotAlerts.length === 0 ? (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 40, textAlign: 'center', color: DL.text.muted, fontSize: 13,
        }}>
          Aucune alerte de securite.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {screenshotAlerts.map(alert => {
            const isExpanded = expandedId === alert.id;
            const emp = alert.employee;
            const severityColor = SEVERITY_COLORS[alert.severity] || '#ef4444';

            return (
              <div key={alert.id} style={{
                background: DL.elevated,
                border: `1px solid ${alert.acknowledged ? DL.glassBorder : `${severityColor}40`}`,
                borderRadius: 14, overflow: 'hidden',
                opacity: alert.acknowledged ? 0.7 : 1,
              }}>
                {/* Alert Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                    {/* Severity dot */}
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', background: severityColor,
                      boxShadow: alert.acknowledged ? 'none' : `0 0 8px ${severityColor}60`,
                      flexShrink: 0,
                    }} />

                    {/* Employee info */}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: DL.text.primary }}>
                        {emp?.first_name} {emp?.last_name}
                        <span style={{ color: DL.text.muted, fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                          {emp?.matricule}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: DL.text.secondary, marginTop: 2 }}>
                        {alert.page_title} — {METHOD_LABELS[alert.detection_method] || alert.detection_method}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp + status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: DL.text.muted }}>
                      {new Date(alert.created_at).toLocaleString('fr-FR', {
                        dateStyle: 'short', timeStyle: 'medium',
                      })}
                    </div>
                    {alert.acknowledged ? (
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        background: 'rgba(16,185,129,0.1)', color: '#10b981',
                      }}>Traitee</span>
                    ) : (
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        background: `${severityColor}15`, color: severityColor,
                      }}>Non lue</span>
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{
                    padding: '0 20px 20px', borderTop: `1px solid ${DL.glassBorder}`,
                  }}>
                    {/* Context summary */}
                    <div style={{
                      background: DL.obsidian, borderRadius: 10, padding: 16, marginTop: 16, marginBottom: 16,
                    }}>
                      <div style={{ fontSize: 11, color: DL.text.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Resume contextuel
                      </div>
                      <p style={{ fontSize: 13, color: DL.text.secondary, lineHeight: 1.6, margin: 0 }}>
                        {alert.context_summary}
                      </p>
                    </div>

                    {/* Employee details */}
                    <div style={{
                      display: 'flex', gap: 24, marginBottom: 16, fontSize: 12,
                    }}>
                      <div>
                        <span style={{ color: DL.text.muted }}>Nom: </span>
                        <span style={{ color: DL.text.primary, fontWeight: 500 }}>{emp?.first_name} {emp?.last_name}</span>
                      </div>
                      <div>
                        <span style={{ color: DL.text.muted }}>Matricule: </span>
                        <span style={{ color: DL.gold400, fontWeight: 600 }}>{emp?.matricule}</span>
                      </div>
                      <div>
                        <span style={{ color: DL.text.muted }}>Page: </span>
                        <span style={{ color: DL.text.primary }}>{alert.page_url}</span>
                      </div>
                      <div>
                        <span style={{ color: DL.text.muted }}>Methode: </span>
                        <span style={{ color: severityColor }}>{alert.detection_method}</span>
                      </div>
                    </div>

                    {/* Screenshot preview */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: DL.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Capture de l'ecran au moment de la tentative
                      </div>
                      <div style={{
                        background: DL.obsidian, border: `1px solid ${DL.glassBorder}`,
                        borderRadius: 10, padding: 8, textAlign: 'center',
                      }}>
                        <img
                          src={alert.screenshot}
                          alt="Screenshot capture"
                          style={{
                            maxWidth: '100%', maxHeight: 400, borderRadius: 6,
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        style={{
                          padding: '10px 24px', background: `${DL.gold400}15`, color: DL.gold400,
                          border: `1px solid ${DL.gold400}30`, borderRadius: 10, fontSize: 12,
                          fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Marquer comme traitee
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
