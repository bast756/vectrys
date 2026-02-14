// ============================================================================
// VECTRYS — CRM Page (Pipeline Kanban)
// Prospect management with drag-free kanban columns
// ============================================================================

import { useEffect, useState } from 'react';
import { useEmployeeStore } from '@/store';

const DL = {
  surface: '#121828', elevated: '#171e34', hover: '#1c2440',
  glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
};

const STAGES = [
  { key: 'new', label: 'Nouveau', color: '#64748b' },
  { key: 'contacted', label: 'Contacte', color: '#06b6d4' },
  { key: 'meeting', label: 'RDV', color: '#a78bfa' },
  { key: 'proposal', label: 'Proposition', color: DL.gold400 },
  { key: 'won', label: 'Gagne', color: '#10b981' },
  { key: 'lost', label: 'Perdu', color: '#ef4444' },
];

const FATE_OPTIONS = ['F', 'A', 'T', 'E'];
const INTERLOCUTOR_OPTIONS = ['journalist', 'investor', 'pdg', 'prospect'];

export default function CRMPage() {
  const { prospects, fetchProspects, createProspect, updateProspect, deleteProspect } = useEmployeeStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    company_name: '', contact_name: '', contact_role: '', phone: '', email: '',
    fate_profile: '', interlocutor_type: '', notes: '', next_action: '', next_action_date: '',
  });

  useEffect(() => { fetchProspects(); }, []);

  const filtered = search
    ? prospects.filter(p =>
        p.company_name.toLowerCase().includes(search.toLowerCase()) ||
        (p.contact_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : prospects;

  const handleCreate = async () => {
    if (!form.company_name) return;
    await createProspect(form);
    setForm({ company_name: '', contact_name: '', contact_role: '', phone: '', email: '', fate_profile: '', interlocutor_type: '', notes: '', next_action: '', next_action_date: '' });
    setShowForm(false);
  };

  const moveProspect = async (id: string, newStatus: string) => {
    await updateProspect(id, { status: newStatus });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: DL.text.primary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          CRM Pipeline
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" placeholder="Rechercher..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 14px', background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
              borderRadius: 8, color: DL.text.primary, fontSize: 12, outline: 'none', width: 200,
            }}
          />
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', background: `${DL.gold400}15`, color: DL.gold400,
            border: `1px solid ${DL.gold400}30`, borderRadius: 8, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>+ Prospect</button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { key: 'company_name', placeholder: 'Entreprise *', type: 'text' },
              { key: 'contact_name', placeholder: 'Contact', type: 'text' },
              { key: 'contact_role', placeholder: 'Role (PDG, DRH...)', type: 'text' },
              { key: 'phone', placeholder: 'Telephone', type: 'text' },
              { key: 'email', placeholder: 'Email', type: 'email' },
              { key: 'next_action', placeholder: 'Prochaine action', type: 'text' },
            ].map(f => (
              <input key={f.key} type={f.type} placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={{
                  padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`,
                  borderRadius: 8, color: DL.text.primary, fontSize: 12, outline: 'none',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <select value={form.fate_profile} onChange={e => setForm({ ...form, fate_profile: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}>
              <option value="">Profil FATE</option>
              {FATE_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={form.interlocutor_type} onChange={e => setForm({ ...form, interlocutor_type: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}>
              <option value="">Type interlocuteur</option>
              {INTERLOCUTOR_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`,
              borderRadius: 8, color: DL.text.primary, fontSize: 12, outline: 'none', minHeight: 60,
              resize: 'vertical', boxSizing: 'border-box', marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} style={{
              padding: '10px 20px', background: DL.gold400, color: '#05080d', border: 'none',
              borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>Creer</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px 20px', background: 'transparent', color: DL.text.muted,
              border: `1px solid ${DL.glassBorder}`, borderRadius: 8, fontSize: 12, cursor: 'pointer',
            }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
        {STAGES.map(stage => {
          const stageProspects = filtered.filter(p => p.status === stage.key);
          return (
            <div key={stage.key} style={{
              minWidth: 220, flex: 1, background: DL.elevated,
              border: `1px solid ${DL.glassBorder}`, borderRadius: 14,
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Column header */}
              <div style={{
                padding: '12px 14px', borderBottom: `1px solid ${DL.glassBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: DL.text.primary }}>{stage.label}</span>
                </div>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 8,
                  background: `${stage.color}20`, color: stage.color, fontWeight: 700,
                }}>{stageProspects.length}</span>
              </div>

              {/* Cards */}
              <div style={{ padding: 8, flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
                {stageProspects.map(p => (
                  <div key={p.id} style={{
                    background: DL.surface, border: `1px solid ${DL.glassBorder}`,
                    borderRadius: 10, padding: 12, marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DL.text.primary, marginBottom: 4 }}>
                      {p.company_name}
                    </div>
                    {p.contact_name && (
                      <div style={{ fontSize: 11, color: DL.text.secondary, marginBottom: 6 }}>
                        {p.contact_name} {p.contact_role ? `(${p.contact_role})` : ''}
                      </div>
                    )}
                    {p.fate_profile && (
                      <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 8,
                        background: `${DL.gold400}15`, color: DL.gold400, fontWeight: 700, marginRight: 4,
                      }}>FATE: {p.fate_profile}</span>
                    )}
                    {p.last_contact && (
                      <div style={{ fontSize: 10, color: DL.text.muted, marginTop: 6 }}>
                        Dernier contact: {new Date(p.last_contact).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    {/* Move buttons */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      {STAGES.filter(s => s.key !== stage.key).slice(0, 3).map(s => (
                        <button key={s.key} onClick={() => moveProspect(p.id, s.key)} style={{
                          fontSize: 9, padding: '3px 6px', background: `${s.color}10`, color: s.color,
                          border: `1px solid ${s.color}25`, borderRadius: 4, cursor: 'pointer',
                        }}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
