// ═══════════════════════════════════════════════════════════════════
// VECTRYS COMMAND CENTER — Dashboard React unifié
// Data Assets + Architecture Health + Analytics + Compliance
//
// Accès INTERNE uniquement (ADMIN, INTERNAL_DATA, CTO, CEO)
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/v1/internal/data-engine';

// ─── Styles CSS-in-JS ──────────────────────────────────────────
const styles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    background: '#0f0f23',
    color: '#e0e0e0',
    minHeight: '100vh',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #2a2a4a',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#888',
    marginTop: '4px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  tab: {
    padding: '10px 20px',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    background: 'transparent',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    border: '1px solid transparent',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '13px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#fff',
  },
  cardSub: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '1px solid #2a2a4a',
    color: '#888',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #1a1a2e',
  },
  badge: (color) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    background: `${color}20`,
    color: color,
  }),
  progressBar: (pct, color) => ({
    width: '100%',
    height: '6px',
    background: '#2a2a4a',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
  }),
  progressFill: (pct, color) => ({
    width: `${Math.min(pct, 100)}%`,
    height: '100%',
    background: color,
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  }),
  alertBox: (severity) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '8px',
    border: `1px solid ${severity === 'critical' ? '#ff4444' : severity === 'high' ? '#ff8800' : '#ffcc00'}40`,
    background: `${severity === 'critical' ? '#ff4444' : severity === 'high' ? '#ff8800' : '#ffcc00'}10`,
    fontSize: '13px',
  }),
};

// ─── Mock Data (remplacer par API réelle) ──────────────────────
const MOCK_ASSETS = [
  { id: '1', name: 'Booking Patterns', slug: 'booking-patterns', category: 'behavioral', sensitivity_level: 3, contains_pii: true, pii_types: ['email', 'phone'], quality_score: 87, uniqueness_score: 92, demand_score: 85, freshness_score: 90, monetization_score: 88, volume_records: 1250000, freshness_hours: 1, pipeline_stage: 'enriched', anonymization_level: 'k_anonymous', base_price_per_1000: 8, estimated_revenue_min: 15000, estimated_revenue_max: 45000, eligible_models: ['api_access', 'insight_packages'], tags: ['real-time', 'seasonal'] },
  { id: '2', name: 'Pricing Intelligence', slug: 'pricing-intelligence', category: 'market', sensitivity_level: 2, contains_pii: false, pii_types: [], quality_score: 94, uniqueness_score: 88, demand_score: 95, freshness_score: 85, monetization_score: 93, volume_records: 850000, freshness_hours: 6, pipeline_stage: 'published', anonymization_level: 'aggregated', base_price_per_1000: 12, estimated_revenue_min: 25000, estimated_revenue_max: 75000, eligible_models: ['api_access', 'benchmark_reports'], tags: ['dynamic', 'competitive'] },
  { id: '3', name: 'Guest Satisfaction Metrics', slug: 'guest-satisfaction', category: 'behavioral', sensitivity_level: 2, contains_pii: false, pii_types: [], quality_score: 91, uniqueness_score: 78, demand_score: 82, freshness_score: 70, monetization_score: 80, volume_records: 420000, freshness_hours: 24, pipeline_stage: 'enriched', anonymization_level: 'pseudonymized', base_price_per_1000: 8, estimated_revenue_min: 8000, estimated_revenue_max: 20000, eligible_models: ['insight_packages', 'benchmark_reports'], tags: ['NPS', 'reviews'] },
  { id: '4', name: 'Occupancy Forecasts', slug: 'occupancy-forecasts', category: 'predictive', sensitivity_level: 1, contains_pii: false, pii_types: [], quality_score: 89, uniqueness_score: 95, demand_score: 90, freshness_score: 88, monetization_score: 91, volume_records: 2100000, freshness_hours: 1, pipeline_stage: 'published', anonymization_level: 'fully_anonymous', base_price_per_1000: 20, estimated_revenue_min: 40000, estimated_revenue_max: 120000, eligible_models: ['api_access', 'ai_training', 'embedded_analytics'], tags: ['ML', 'forecast', 'seasonal'] },
  { id: '5', name: 'Revenue per Property', slug: 'revenue-per-property', category: 'financial', sensitivity_level: 4, contains_pii: true, pii_types: ['payment_info'], quality_score: 96, uniqueness_score: 85, demand_score: 75, freshness_score: 60, monetization_score: 78, volume_records: 180000, freshness_hours: 168, pipeline_stage: 'classified', anonymization_level: 'raw', base_price_per_1000: 15, estimated_revenue_min: 5000, estimated_revenue_max: 15000, eligible_models: ['benchmark_reports'], tags: ['financial', 'sensitive'] },
  { id: '6', name: 'Geographic Demand Heatmap', slug: 'geo-demand-heatmap', category: 'geographic', sensitivity_level: 1, contains_pii: false, pii_types: [], quality_score: 82, uniqueness_score: 90, demand_score: 88, freshness_score: 92, monetization_score: 86, volume_records: 3500000, freshness_hours: 1, pipeline_stage: 'published', anonymization_level: 'aggregated', base_price_per_1000: 5, estimated_revenue_min: 12000, estimated_revenue_max: 35000, eligible_models: ['api_access', 'data_marketplace'], tags: ['geo', 'heatmap', 'real-time'] },
];

const MOCK_COMPLIANCE = [
  { regulation: 'RGPD', status: 'compliant', score: 94, alerts: 2 },
  { regulation: 'Data Act EU', status: 'compliant', score: 88, alerts: 5 },
  { regulation: 'IA Act EU', status: 'pending_review', score: 72, alerts: 8 },
  { regulation: 'Loi ALUR', status: 'compliant', score: 96, alerts: 1 },
  { regulation: 'Loi ELAN', status: 'compliant', score: 91, alerts: 3 },
];

const categoryColors = {
  operational: '#4fc3f7',
  behavioral: '#ab47bc',
  market: '#66bb6a',
  predictive: '#ffa726',
  financial: '#ef5350',
  geographic: '#26c6da',
};

const stageColors = {
  raw: '#888',
  classified: '#4fc3f7',
  anonymized: '#ab47bc',
  enriched: '#66bb6a',
  packaged: '#ffa726',
  published: '#4caf50',
};

// ─── Component ─────────────────────────────────────────────────
export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('assets');
  const [assets] = useState(MOCK_ASSETS);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'assets', label: 'Data Assets' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'architecture', label: 'Architecture' },
  ];

  // Summary metrics
  const totalRevMin = assets.reduce((s, a) => s + a.estimated_revenue_min, 0);
  const totalRevMax = assets.reduce((s, a) => s + a.estimated_revenue_max, 0);
  const totalRecords = assets.reduce((s, a) => s + a.volume_records, 0);
  const avgQuality = Math.round(assets.reduce((s, a) => s + a.quality_score, 0) / assets.length);
  const publishedCount = assets.filter(a => a.pipeline_stage === 'published').length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>VECTRYS Command Center</h1>
          <div style={styles.subtitle}>Data Engine v3.0 — Internal Only</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={styles.badge('#4caf50')}>OPERATIONAL</span>
          <span style={{ fontSize: '12px', color: '#666' }}>{new Date().toLocaleString('fr-FR')}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Revenue potentiel</div>
          <div style={styles.cardValue}>{(totalRevMin / 1000).toFixed(0)}k - {(totalRevMax / 1000).toFixed(0)}k</div>
          <div style={styles.cardSub}>EUR/an estimation</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Data Assets</div>
          <div style={styles.cardValue}>{assets.length}</div>
          <div style={styles.cardSub}>{publishedCount} publiés, {assets.length - publishedCount} en pipeline</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Volume total</div>
          <div style={styles.cardValue}>{(totalRecords / 1_000_000).toFixed(1)}M</div>
          <div style={styles.cardSub}>enregistrements</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Qualité moyenne</div>
          <div style={styles.cardValue}>{avgQuality}%</div>
          <div style={styles.cardSub}>score qualité global</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t.id}
            style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'assets' && <AssetsView assets={assets} />}
      {activeTab === 'analytics' && <AnalyticsView assets={assets} />}
      {activeTab === 'compliance' && <ComplianceView />}
      {activeTab === 'architecture' && <ArchitectureView assets={assets} />}
    </div>
  );
}

// ─── Data Assets View ──────────────────────────────────────────
function AssetsView({ assets }) {
  return (
    <div style={styles.card}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Data Assets Inventory</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Asset</th>
            <th style={styles.th}>Catégorie</th>
            <th style={styles.th}>Stage</th>
            <th style={styles.th}>Qualité</th>
            <th style={styles.th}>Valeur</th>
            <th style={styles.th}>Volume</th>
            <th style={styles.th}>PII</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(a => (
            <tr key={a.id} style={{ cursor: 'pointer' }}>
              <td style={styles.td}>
                <div style={{ fontWeight: 600, color: '#fff' }}>{a.name}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>{a.tags.join(', ')}</div>
              </td>
              <td style={styles.td}>
                <span style={styles.badge(categoryColors[a.category] || '#888')}>
                  {a.category}
                </span>
              </td>
              <td style={styles.td}>
                <span style={styles.badge(stageColors[a.pipeline_stage] || '#888')}>
                  {a.pipeline_stage}
                </span>
              </td>
              <td style={styles.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={styles.progressBar()}>
                    <div style={styles.progressFill(a.quality_score, a.quality_score > 80 ? '#4caf50' : a.quality_score > 60 ? '#ff9800' : '#f44336')} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>{a.quality_score}%</span>
                </div>
              </td>
              <td style={styles.td}>
                <div style={{ color: '#4caf50', fontWeight: 600 }}>
                  {(a.estimated_revenue_min / 1000).toFixed(0)}k-{(a.estimated_revenue_max / 1000).toFixed(0)}k
                </div>
              </td>
              <td style={styles.td}>
                <span style={{ color: '#aaa' }}>{(a.volume_records / 1000).toFixed(0)}k</span>
              </td>
              <td style={styles.td}>
                {a.contains_pii
                  ? <span style={styles.badge('#ff4444')}>PII</span>
                  : <span style={styles.badge('#4caf50')}>Safe</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Analytics View ────────────────────────────────────────────
function AnalyticsView({ assets }) {
  const categories = {};
  assets.forEach(a => {
    if (!categories[a.category]) categories[a.category] = { count: 0, totalRev: 0, totalQuality: 0 };
    categories[a.category].count++;
    categories[a.category].totalRev += (a.estimated_revenue_min + a.estimated_revenue_max) / 2;
    categories[a.category].totalQuality += a.quality_score;
  });

  return (
    <div>
      <div style={styles.grid}>
        {Object.entries(categories).map(([cat, data]) => (
          <div key={cat} style={{ ...styles.card, borderLeft: `3px solid ${categoryColors[cat] || '#888'}` }}>
            <div style={styles.cardTitle}>{cat}</div>
            <div style={styles.cardValue}>{data.count}</div>
            <div style={styles.cardSub}>
              Rev. moy: {(data.totalRev / data.count / 1000).toFixed(0)}k EUR |
              Qualité: {Math.round(data.totalQuality / data.count)}%
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Scores par Asset</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Asset</th>
              <th style={styles.th}>Qualité</th>
              <th style={styles.th}>Unicité</th>
              <th style={styles.th}>Demande</th>
              <th style={styles.th}>Fraicheur</th>
              <th style={styles.th}>Score total</th>
            </tr>
          </thead>
          <tbody>
            {assets.sort((a, b) => b.monetization_score - a.monetization_score).map(a => (
              <tr key={a.id}>
                <td style={styles.td}><span style={{ fontWeight: 600, color: '#fff' }}>{a.name}</span></td>
                <td style={styles.td}>{a.quality_score}</td>
                <td style={styles.td}>{a.uniqueness_score}</td>
                <td style={styles.td}>{a.demand_score}</td>
                <td style={styles.td}>{a.freshness_score}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge(a.monetization_score > 85 ? '#4caf50' : '#ff9800'), fontWeight: 700, fontSize: '13px' }}>
                    {a.monetization_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Compliance View ───────────────────────────────────────────
function ComplianceView() {
  const statusColors = {
    compliant: '#4caf50',
    non_compliant: '#f44336',
    pending_review: '#ff9800',
    remediation_needed: '#ff5722',
  };

  return (
    <div>
      <div style={styles.grid}>
        {MOCK_COMPLIANCE.map(c => (
          <div key={c.regulation} style={styles.card}>
            <div style={styles.cardTitle}>{c.regulation}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.cardValue}>{c.score}%</div>
              <span style={styles.badge(statusColors[c.status])}>
                {c.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ marginTop: '12px' }}>
              <div style={styles.progressBar()}>
                <div style={styles.progressFill(c.score, c.score > 90 ? '#4caf50' : c.score > 75 ? '#ff9800' : '#f44336')} />
              </div>
            </div>
            <div style={styles.cardSub}>{c.alerts} alertes actives</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Alertes Compliance</h3>
        <div style={styles.alertBox('high')}>
          <strong>IA Act EU</strong> — 8 assets requièrent une revue de conformité IA. Classification de risque en attente pour les modèles prédictifs.
        </div>
        <div style={styles.alertBox('medium')}>
          <strong>Data Act EU</strong> — 5 datasets doivent documenter les conditions de partage B2B selon le Data Act.
        </div>
        <div style={styles.alertBox('low')}>
          <strong>RGPD</strong> — 2 assets contiennent des PII non encore anonymisés au niveau k-anonymous.
        </div>
      </div>
    </div>
  );
}

// ─── Architecture View ─────────────────────────────────────────
function ArchitectureView({ assets }) {
  const stages = ['raw', 'classified', 'anonymized', 'enriched', 'packaged', 'published'];
  const stageCounts = {};
  stages.forEach(s => { stageCounts[s] = assets.filter(a => a.pipeline_stage === s).length; });

  return (
    <div>
      {/* Pipeline Overview */}
      <div style={styles.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Pipeline de valorisation</h3>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {stages.map((stage, i) => (
            <div key={stage} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                padding: '16px 8px',
                background: stageCounts[stage] > 0 ? `${stageColors[stage]}20` : '#1a1a2e',
                border: `1px solid ${stageCounts[stage] > 0 ? stageColors[stage] : '#2a2a4a'}`,
                borderRadius: '8px',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: stageColors[stage] }}>{stageCounts[stage]}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', textTransform: 'uppercase' }}>{stage}</div>
              </div>
              {i < stages.length - 1 && (
                <div style={{ color: '#444', fontSize: '20px', margin: '8px 0' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div style={{ ...styles.grid, marginTop: '16px' }}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Classification IA</div>
          <div style={{ ...styles.cardValue, color: '#4caf50' }}>OK</div>
          <div style={styles.cardSub}>Claude Sonnet 4.5 — latence moy. 1.2s</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Anonymisation</div>
          <div style={{ ...styles.cardValue, color: '#4caf50' }}>OK</div>
          <div style={styles.cardSub}>k-anonymat k=5, DP epsilon=1.0</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Pricing Engine</div>
          <div style={{ ...styles.cardValue, color: '#4caf50' }}>OK</div>
          <div style={styles.cardSub}>Stripe connecté, 4 tiers actifs</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Base de données</div>
          <div style={{ ...styles.cardValue, color: '#4caf50' }}>OK</div>
          <div style={styles.cardSub}>PostgreSQL — Prisma ORM</div>
        </div>
      </div>

      {/* Security Layers */}
      <div style={{ ...styles.card, marginTop: '16px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Couches de sécurité</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Couche</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['IP Whitelist', process.env.INTERNAL_ALLOWED_IPS ? 'active' : 'optional', 'Filtrage IP (configurable via env var)'],
              ['Auth JWT', 'active', "Vérifie l'authentification de l'utilisateur"],
              ['RBAC internalOnly', 'active', 'Vérifie rôle ADMIN/INTERNAL_DATA/CTO/CEO'],
              ['Permissions granulaires', 'active', 'requirePermission() par endpoint'],
              ['Rate limit sensible', 'active', '5 req/min sur audit et export'],
              ['Audit trail', 'active', 'Chaque accès logué'],
              ['404 stealth', 'active', "Retourne 404 au lieu de 403 pour masquer l'existence"],
              ['Lazy loading', 'active', 'Code jamais chargé pour les utilisateurs externes'],
            ].map(([layer, status, desc]) => (
              <tr key={layer}>
                <td style={styles.td}><strong style={{ color: '#fff' }}>{layer}</strong></td>
                <td style={styles.td}>
                  <span style={styles.badge(status === 'active' ? '#4caf50' : '#ff9800')}>
                    {status}
                  </span>
                </td>
                <td style={styles.td}><span style={{ color: '#aaa' }}>{desc}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
