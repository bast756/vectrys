// ============================================================================
// VECTRYS — Employee Dashboard Page
// KPI cards, recent activity, quick actions — DIVINE LUMINANCE theme
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store';
import { employeeApi } from '@/api/employeeApi';

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
  const { employee, tasks, prospects, fetchTasks, fetchProspects } = useEmployeeStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const isCEO = employee?.role === 'ceo';

  useEffect(() => {
    fetchTasks();
    fetchProspects();
    if (isCEO) {
      employeeApi.getOverview().then(r => setOverview(r.data.data)).catch(() => {});
    }
  }, []);

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
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Nouvel appel', onClick: () => navigate('/employee/calls'), color: '#2563eb' },
          { label: 'Nouveau prospect', onClick: () => navigate('/employee/crm'), color: '#10b981' },
          { label: 'Nouvelle note', onClick: () => navigate('/employee/notes'), color: DL.gold400 },
        ].map(a => (
          <button key={a.label} onClick={a.onClick} style={{
            padding: '10px 20px', background: `${a.color}15`, color: a.color,
            border: `1px solid ${a.color}30`, borderRadius: 10, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>{a.label}</button>
        ))}
      </div>

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
