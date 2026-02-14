// ============================================================================
// VECTRYS — Planning Page (CEO only)
// Weekly/monthly view with task assignment
// ============================================================================

import { useEffect, useState } from 'react';
import { useEmployeeStore } from '@/store';

const DL = {
  surface: '#121828', elevated: '#171e34', glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
};

const PRIORITY_COLORS: Record<string, string> = { low: '#64748b', medium: '#06b6d4', high: '#d4a853' };

export default function PlanningPage() {
  const { employee, team, tasks, fetchTeam, fetchTasks, createTask, updateTask } = useEmployeeStore();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', employee_id: '', priority: 'medium', start_date: '', due_date: '' });

  useEffect(() => { fetchTeam(); fetchTasks(); }, []);

  if (employee?.role !== 'ceo') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: DL.text.muted, fontSize: 13 }}>
        Acces reserve au CEO
      </div>
    );
  }

  // Generate days for current view
  const getDays = () => {
    const start = new Date(currentDate);
    const days: Date[] = [];
    if (view === 'week') {
      start.setDate(start.getDate() - start.getDay() + 1); // Monday
      for (let i = 0; i < 7; i++) {
        days.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    } else {
      start.setDate(1);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        days.push(new Date(start));
        start.setDate(start.getDate() + 1);
      }
    }
    return days;
  };

  const days = getDays();
  const today = new Date().toDateString();

  const navigate = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
  };

  const getTasksForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => {
      if (!t.due_date) return false;
      return t.due_date.split('T')[0] === dateStr;
    });
  };

  const handleCreate = async () => {
    if (!form.title) return;
    await createTask(form);
    setForm({ title: '', employee_id: '', priority: 'medium', start_date: '', due_date: '' });
    setShowForm(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: DL.text.primary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Planning
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          {(['week', 'month'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 11,
              background: view === v ? `${DL.gold400}15` : 'transparent',
              color: view === v ? DL.gold400 : DL.text.muted,
              border: `1px solid ${view === v ? `${DL.gold400}30` : 'transparent'}`,
              cursor: 'pointer', fontWeight: view === v ? 700 : 400,
            }}>{v === 'week' ? 'Semaine' : 'Mois'}</button>
          ))}
          <button onClick={() => navigate(-1)} style={{
            padding: '6px 10px', background: 'transparent', color: DL.text.secondary,
            border: `1px solid ${DL.glassBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 14,
          }}>&larr;</button>
          <span style={{ fontSize: 13, color: DL.text.primary, fontWeight: 500, minWidth: 120, textAlign: 'center' }}>
            {view === 'week'
              ? `${days[0]?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${days[6]?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
              : currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
            }
          </span>
          <button onClick={() => navigate(1)} style={{
            padding: '6px 10px', background: 'transparent', color: DL.text.secondary,
            border: `1px solid ${DL.glassBorder}`, borderRadius: 6, cursor: 'pointer', fontSize: 14,
          }}>&rarr;</button>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', background: `${DL.gold400}15`, color: DL.gold400,
            border: `1px solid ${DL.gold400}30`, borderRadius: 8, fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}>+ Assigner</button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input type="text" placeholder="Titre *" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12, outline: 'none' }}
            />
            <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}>
              <option value="">Assigner a...</option>
              {team.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
            <input type="date" value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}
            />
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
          </div>
          <button onClick={handleCreate} style={{
            padding: '8px 20px', background: DL.gold400, color: '#05080d', border: 'none',
            borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Assigner</button>
        </div>
      )}

      {/* Calendar grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: view === 'week' ? 'repeat(7, 1fr)' : 'repeat(7, 1fr)',
        gap: 1, background: DL.glassBorder, borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Day headers */}
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
          <div key={d} style={{
            padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 700,
            color: DL.text.muted, background: DL.surface, textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>{d}</div>
        ))}

        {/* Fill empty cells for month view */}
        {view === 'month' && Array.from({ length: (days[0]?.getDay() || 7) - 1 }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: DL.elevated, minHeight: 80 }} />
        ))}

        {/* Day cells */}
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isToday = day.toDateString() === today;
          return (
            <div key={day.toISOString()} style={{
              background: isToday ? '#171e34' : DL.elevated,
              minHeight: view === 'week' ? 200 : 80, padding: 8,
              borderTop: isToday ? `2px solid ${DL.gold400}` : 'none',
            }}>
              <div style={{
                fontSize: 12, fontWeight: isToday ? 700 : 400,
                color: isToday ? DL.gold400 : DL.text.secondary, marginBottom: 6,
              }}>
                {day.getDate()}
              </div>
              {dayTasks.map(t => (
                <div key={t.id} style={{
                  padding: '3px 6px', marginBottom: 2, borderRadius: 4,
                  background: `${PRIORITY_COLORS[t.priority] || '#64748b'}15`,
                  borderLeft: `2px solid ${PRIORITY_COLORS[t.priority] || '#64748b'}`,
                  fontSize: 10, color: DL.text.primary, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={`${t.title} (${t.employee?.first_name || ''})`}>
                  {t.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
