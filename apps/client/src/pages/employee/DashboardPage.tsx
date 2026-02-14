// ============================================================================
// VECTRYS — Employee Dashboard Page
// KPI cards, recent activity, quick actions — DIVINE LUMINANCE theme
// ============================================================================

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store';
import { employeeApi } from '@/api/employeeApi';

interface SessionData {
  id: string;
  employee_id: string;
  login_at: string;
  logout_at?: string | null;
  ip_address?: string;
  is_active: boolean;
  outside_schedule: boolean;
  employee?: { first_name: string; last_name: string; matricule: string };
}

interface ScheduleAlert {
  id: string;
  login_at: string;
  outside_schedule: boolean;
  employee?: { first_name: string; last_name: string; matricule: string };
}

const DL = {
  surface: '#121828', elevated: '#171e34', glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853', text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
};

interface OverviewData {
  totalEmployees: number;
  totalProspects: number;
  totalCalls: number;
  todayCalls: number;
  prospectsByStatus: Record<string, number>;
  recentProspects: Array<{ company_name: string; status: string; employee?: { first_name: string; last_name: string } }>;
}

function KPICard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
      borderRadius: 14, padding: 20, flex: 1, minWidth: 160,
    }}>
      <div style={{ fontSize: 11, color: DL.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "'DM Sans', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { employee, tasks, prospects, fetchTasks, fetchProspects, registerEmployee } = useEmployeeStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [scheduleAlerts, setScheduleAlerts] = useState<ScheduleAlert[]>([]);
  const isCEO = employee?.role === 'ceo';

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', role: 'employee', workScheduleStart: '08:00', workScheduleEnd: '19:00' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ matricule: string; tempPassword?: string } | null>(null);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchProspects();
    if (isCEO) {
      employeeApi.getOverview().then(r => setOverview(r.data.data)).catch(() => {});
      employeeApi.getSessionsToday().then(r => setSessions(r.data.data.sessions || [])).catch(() => {});
      employeeApi.getScheduleAlerts({ limit: '10' }).then(r => setScheduleAlerts(r.data.data || [])).catch(() => {});
    }
  }, []);

  const handleInvite = async () => {
    setInviteLoading(true);
    setInviteError('');
    setInviteResult(null);
    try {
      const result = await registerEmployee(inviteForm);
      setInviteResult({ matricule: result.employee.matricule, tempPassword: result.tempPassword });
    } catch (err: any) {
      setInviteError(err?.response?.data?.error || err?.message || 'Erreur');
    } finally {
      setInviteLoading(false);
    }
  };

  const todayTasks = tasks.filter(t => t.status !== 'done').length;
  const pipelineCount = prospects.filter(p => !['won', 'lost'].includes(p.status)).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: DL.text.primary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Bonjour, {employee?.first_name}
        </h1>
        <p style={{ fontSize: 13, color: DL.text.muted, margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KPICard label="Taches en cours" value={todayTasks} color="#06b6d4" />
        <KPICard label="Prospects actifs" value={pipelineCount} color="#10b981" />
        {isCEO && overview && (
          <>
            <KPICard label="Appels aujourd'hui" value={overview.todayCalls} color={DL.gold400} />
            <KPICard label="Employes actifs" value={overview.totalEmployees} color="#a78bfa" />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {[
          { label: 'Nouvel appel', onClick: () => navigate('/employee/calls'), color: '#2563eb' },
          { label: 'Nouveau prospect', onClick: () => navigate('/employee/crm'), color: '#10b981' },
          { label: 'Nouvelle note', onClick: () => navigate('/employee/notes'), color: DL.gold400 },
          ...(isCEO ? [{ label: 'Inviter un employe', onClick: () => { setShowInvite(true); setInviteResult(null); setInviteError(''); }, color: '#a78bfa' }] : []),
        ].map(a => (
          <button key={a.label} onClick={a.onClick} style={{
            padding: '10px 20px', background: `${a.color}15`, color: a.color,
            border: `1px solid ${a.color}30`, borderRadius: 10, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>{a.label}</button>
        ))}
      </div>

      {/* ── INVITE MODAL ── */}
      {showInvite && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}>
          <div style={{
            background: DL.surface, border: `1px solid ${DL.glassBorder}`,
            borderRadius: 16, padding: 32, width: 420, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: DL.text.primary, margin: '0 0 20px', fontFamily: "'DM Sans', sans-serif" }}>
              Inviter un employe
            </h3>

            {inviteResult ? (
              <div>
                <div style={{ background: '#10b98115', border: '1px solid #10b98130', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#10b981', fontWeight: 600, margin: '0 0 8px' }}>Employe cree avec succes</p>
                  <p style={{ fontSize: 13, color: DL.text.secondary, margin: '0 0 4px' }}>Matricule : <strong style={{ color: DL.gold400 }}>{inviteResult.matricule}</strong></p>
                  {inviteResult.tempPassword && (
                    <p style={{ fontSize: 13, color: DL.text.secondary, margin: 0 }}>Mot de passe : <strong style={{ color: DL.text.primary }}>{inviteResult.tempPassword}</strong></p>
                  )}
                  <p style={{ fontSize: 11, color: DL.text.muted, margin: '8px 0 0' }}>Un email d'invitation a ete envoye.</p>
                </div>
                <button onClick={() => { setShowInvite(false); setInviteForm({ firstName: '', lastName: '', email: '', role: 'employee', workScheduleStart: '08:00', workScheduleEnd: '19:00' }); }} style={{
                  width: '100%', padding: '12px 0', background: `${DL.gold400}15`, color: DL.gold400,
                  border: `1px solid ${DL.gold400}30`, borderRadius: 10, fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>Fermer</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input placeholder="Prenom" value={inviteForm.firstName} onChange={e => setInviteForm(f => ({ ...f, firstName: e.target.value }))} style={modalInput} />
                  <input placeholder="Nom" value={inviteForm.lastName} onChange={e => setInviteForm(f => ({ ...f, lastName: e.target.value }))} style={modalInput} />
                </div>
                <input placeholder="Email (@vectrys.fr)" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} style={{ ...modalInput, marginBottom: 10 }} />
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} style={{ ...modalInput, marginBottom: 10 }}>
                  <option value="employee">Employe</option>
                  <option value="manager">Manager</option>
                </select>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: DL.text.muted, display: 'block', marginBottom: 4 }}>Debut horaire</label>
                    <input type="time" value={inviteForm.workScheduleStart} onChange={e => setInviteForm(f => ({ ...f, workScheduleStart: e.target.value }))} style={modalInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: DL.text.muted, display: 'block', marginBottom: 4 }}>Fin horaire</label>
                    <input type="time" value={inviteForm.workScheduleEnd} onChange={e => setInviteForm(f => ({ ...f, workScheduleEnd: e.target.value }))} style={modalInput} />
                  </div>
                </div>

                {inviteError && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 10px' }}>{inviteError}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowInvite(false)} style={{
                    flex: 1, padding: '12px 0', background: 'transparent', color: DL.text.muted,
                    border: `1px solid ${DL.glassBorder}`, borderRadius: 10, fontSize: 13,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>Annuler</button>
                  <button onClick={handleInvite} disabled={inviteLoading || !inviteForm.firstName || !inviteForm.email} style={{
                    flex: 1, padding: '12px 0', background: '#a78bfa', color: '#fff',
                    border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: inviteLoading ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif",
                    opacity: inviteLoading || !inviteForm.firstName || !inviteForm.email ? 0.5 : 1,
                  }}>{inviteLoading ? 'Envoi...' : 'Inviter'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CEO: Pipeline overview */}
      {isCEO && overview && (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 20, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: DL.text.primary, margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif" }}>
            Pipeline CRM
          </h3>
          <div style={{ display: 'flex', gap: 12 }}>
            {['new', 'contacted', 'meeting', 'proposal', 'won', 'lost'].map(stage => {
              const count = overview.prospectsByStatus[stage] || 0;
              const colors: Record<string, string> = { new: '#64748b', contacted: '#06b6d4', meeting: '#a78bfa', proposal: DL.gold400, won: '#10b981', lost: '#ef4444' };
              return (
                <div key={stage} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors[stage] || DL.text.primary }}>{count}</div>
                  <div style={{ fontSize: 10, color: DL.text.muted, textTransform: 'capitalize' }}>{stage}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CEO: Schedule alerts */}
      {isCEO && scheduleAlerts.length > 0 && (
        <div style={{
          background: DL.elevated, border: '1px solid #ef444430',
          borderRadius: 14, padding: 20, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif" }}>
            Connexions hors horaires
          </h3>
          {scheduleAlerts.map((a, i) => (
            <div key={a.id || i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: i < scheduleAlerts.length - 1 ? `1px solid ${DL.glassBorder}` : 'none',
            }}>
              <div>
                <span style={{ fontSize: 13, color: DL.text.primary, fontWeight: 500 }}>
                  {a.employee?.first_name} {a.employee?.last_name}
                </span>
                <span style={{ fontSize: 11, color: DL.text.muted, marginLeft: 8 }}>
                  {a.employee?.matricule}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#ef4444' }}>
                {new Date(a.login_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CEO: Today's connections */}
      {isCEO && sessions.length > 0 && (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 20, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: DL.text.primary, margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif" }}>
            Connexions du jour
          </h3>
          <div style={{ fontSize: 11, color: DL.text.muted, display: 'flex', gap: 0, marginBottom: 8, borderBottom: `1px solid ${DL.glassBorder}`, paddingBottom: 6 }}>
            <span style={{ flex: 2 }}>Employe</span>
            <span style={{ flex: 1 }}>Connexion</span>
            <span style={{ flex: 1 }}>Deconnexion</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Statut</span>
          </div>
          {sessions.map((s, i) => (
            <div key={s.id || i} style={{
              display: 'flex', alignItems: 'center', padding: '6px 0',
              borderBottom: i < sessions.length - 1 ? `1px solid ${DL.glassBorder}` : 'none',
            }}>
              <span style={{ flex: 2, fontSize: 13, color: DL.text.primary }}>
                {s.employee?.first_name} {s.employee?.last_name}
                <span style={{ fontSize: 10, color: DL.text.muted, marginLeft: 6 }}>{s.employee?.matricule}</span>
              </span>
              <span style={{ flex: 1, fontSize: 12, color: DL.text.secondary }}>
                {new Date(s.login_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: s.logout_at ? DL.text.secondary : DL.text.muted }}>
                {s.logout_at ? new Date(s.logout_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
              <span style={{ flex: 1, textAlign: 'right' }}>
                {s.outside_schedule ? (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: '#ef444420', color: '#ef4444' }}>Hors horaire</span>
                ) : s.is_active ? (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: '#10b98120', color: '#10b981' }}>En ligne</span>
                ) : (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: DL.text.muted }}>Termine</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recent prospects */}
      {isCEO && overview?.recentProspects && overview.recentProspects.length > 0 && (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: DL.text.primary, margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif" }}>
            Derniers prospects
          </h3>
          {overview.recentProspects.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: i < overview.recentProspects.length - 1 ? `1px solid ${DL.glassBorder}` : 'none',
            }}>
              <div>
                <span style={{ fontSize: 13, color: DL.text.primary, fontWeight: 500 }}>{p.company_name}</span>
                {p.employee && (
                  <span style={{ fontSize: 11, color: DL.text.muted, marginLeft: 8 }}>
                    — {p.employee.first_name} {p.employee.last_name}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', color: DL.text.secondary,
                textTransform: 'capitalize',
              }}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const modalInput: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#0d1220',
  border: '1px solid rgba(255,255,255,0.055)', borderRadius: 8,
  color: '#f1f5f9', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
};
