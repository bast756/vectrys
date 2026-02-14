// ============================================================================
// VECTRYS — Notes Page
// Grid of note cards with categories, pinning, search
// ============================================================================

import { useEffect, useState } from 'react';
import { useEmployeeStore } from '@/store';

const DL = {
  surface: '#121828', elevated: '#171e34', glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
};

const CATEGORIES = [
  { key: 'general', label: 'General', color: '#64748b' },
  { key: 'call', label: 'Appel', color: '#2563eb' },
  { key: 'prospect', label: 'Prospect', color: '#10b981' },
  { key: 'idea', label: 'Idee', color: DL.gold400 },
];

export default function NotesPage() {
  const { notes, fetchNotes, createNote, updateNote, deleteNote } = useEmployeeStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });

  useEffect(() => { fetchNotes(); }, []);

  const filtered = notes.filter(n => {
    if (filterCat && n.category !== filterCat) return false;
    if (search) {
      const s = search.toLowerCase();
      return n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s);
    }
    return true;
  });

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    if (editingId) {
      await updateNote(editingId, form);
      setEditingId(null);
    } else {
      await createNote(form);
    }
    setForm({ title: '', content: '', category: 'general' });
    setShowForm(false);
  };

  const startEdit = (note: typeof notes[0]) => {
    setForm({ title: note.title, content: note.content, category: note.category });
    setEditingId(note.id);
    setShowForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: DL.text.primary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Notes
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 14px', background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
              borderRadius: 8, color: DL.text.primary, fontSize: 12, outline: 'none', width: 180,
            }}
          />
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', content: '', category: 'general' }); }}
            style={{
              padding: '8px 16px', background: `${DL.gold400}15`, color: DL.gold400,
              border: `1px solid ${DL.gold400}30`, borderRadius: 8, fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}>+ Note</button>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button onClick={() => setFilterCat('')}
          style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: !filterCat ? 700 : 400,
            background: !filterCat ? 'rgba(255,255,255,0.05)' : 'transparent',
            color: !filterCat ? DL.text.primary : DL.text.muted,
            border: `1px solid ${!filterCat ? DL.glassBorder : 'transparent'}`, cursor: 'pointer',
          }}>Toutes</button>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setFilterCat(c.key)}
            style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 11,
              fontWeight: filterCat === c.key ? 700 : 400,
              background: filterCat === c.key ? `${c.color}15` : 'transparent',
              color: filterCat === c.key ? c.color : DL.text.muted,
              border: `1px solid ${filterCat === c.key ? `${c.color}30` : 'transparent'}`, cursor: 'pointer',
            }}>{c.label}</button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <input type="text" placeholder="Titre" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px', background: DL.surface,
              border: `1px solid ${DL.glassBorder}`, borderRadius: 8,
              color: DL.text.primary, fontSize: 13, outline: 'none',
              boxSizing: 'border-box', marginBottom: 10,
            }}
          />
          <textarea placeholder="Contenu..." value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px', background: DL.surface,
              border: `1px solid ${DL.glassBorder}`, borderRadius: 8,
              color: DL.text.primary, fontSize: 13, outline: 'none',
              minHeight: 100, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ padding: '8px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <button onClick={handleSave} style={{
              padding: '8px 20px', background: DL.gold400, color: '#05080d', border: 'none',
              borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{editingId ? 'Modifier' : 'Creer'}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{
              padding: '8px 14px', background: 'transparent', color: DL.text.muted,
              border: `1px solid ${DL.glassBorder}`, borderRadius: 8, fontSize: 12, cursor: 'pointer',
            }}>Annuler</button>
          </div>
        </div>
      )}

      {/* Notes grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(note => {
          const cat = CATEGORIES.find(c => c.key === note.category);
          return (
            <div key={note.id} style={{
              background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
              borderRadius: 14, padding: 16, position: 'relative',
              borderTop: `3px solid ${cat?.color || DL.glassBorder}`,
            }}>
              {/* Pin indicator */}
              {note.pinned && (
                <span style={{
                  position: 'absolute', top: 8, right: 10, fontSize: 10, color: DL.gold400,
                }}>Epingle</span>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, color: DL.text.primary, marginBottom: 6 }}>
                {note.title}
              </div>
              <div style={{
                fontSize: 12, color: DL.text.secondary, lineHeight: 1.5,
                maxHeight: 80, overflow: 'hidden',
              }}>
                {note.content}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{
                  fontSize: 9, padding: '2px 8px', borderRadius: 8,
                  background: `${cat?.color || '#64748b'}15`, color: cat?.color || DL.text.muted,
                }}>{cat?.label || note.category}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateNote(note.id, { pinned: !note.pinned })} style={{
                    fontSize: 10, padding: '3px 6px', background: 'transparent',
                    color: note.pinned ? DL.gold400 : DL.text.muted, border: 'none', cursor: 'pointer',
                  }}>{note.pinned ? 'Desepingler' : 'Epingler'}</button>
                  <button onClick={() => startEdit(note)} style={{
                    fontSize: 10, padding: '3px 6px', background: 'transparent',
                    color: '#06b6d4', border: 'none', cursor: 'pointer',
                  }}>Modifier</button>
                  <button onClick={() => deleteNote(note.id)} style={{
                    fontSize: 10, padding: '3px 6px', background: 'transparent',
                    color: '#ef4444', border: 'none', cursor: 'pointer',
                  }}>Suppr</button>
                </div>
              </div>
              <div style={{ fontSize: 10, color: DL.text.muted, marginTop: 8 }}>
                {new Date(note.updated_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: DL.text.muted, fontSize: 13 }}>
          Aucune note {filterCat ? `dans la categorie "${filterCat}"` : ''}{search ? ` pour "${search}"` : ''}
        </div>
      )}
    </div>
  );
}
