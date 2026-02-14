// ============================================================================
// VECTRYS — Gantt Chart Page
// Simple horizontal timeline bars for tasks
// ============================================================================

import { useEffect, useState } from 'react';
import { useEmployeeStore } from '@/store';

const DL = {
  surface: '#121828', elevated: '#171e34', glassBorder: 'rgba(255,255,255,0.055)',
  gold400: '#d4a853',
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#06b6d4',
  high: '#d4a853',
};

const STATUS_COLORS: Record<string, string> = {
  todo: '#64748b',
  in_progress: '#06b6d4',
  done: '#10b981',
};

export default function GanttPage() {
  const { employee, tasks, fetchTasks, createTask } = useEmployeeStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', start_date: '', due_date: '' });
  const isCEO = employee?.role === 'ceo';

  useEffect(() => { fetchTasks(); }, []);

  // Date range: from earliest task start to latest due date (or 30 days from now)
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(now);
  rangeEnd.setDate(rangeEnd.getDate() + 60);

  const totalDays = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));

  const getBarPosition = (start: string | null | undefined, end: string | null | undefined) => {
    const s = start ? new Date(start) : new Date();
    const e = end ? new Date(end) : new Date(s.getTime() + 7 * 24 * 60 * 60 * 1000);
    const left = Math.max(0, ((s.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100);
    const width = Math.max(2, ((e.getTime() - s.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100);
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  };

  // Generate month markers
  const months: { label: string; left: string }[] = [];
  const cur = new Date(rangeStart);
  cur.setDate(1);
  cur.setMonth(cur.getMonth() + 1);
  while (cur <= rangeEnd) {
    const pos = ((cur.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100;
    months.push({ label: cur.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), left: `${pos}%` });
    cur.setMonth(cur.getMonth() + 1);
  }

  const handleCreate = async () => {
    if (!form.title) return;
    await createTask(form);
    setForm({ title: '', description: '', priority: 'medium', start_date: '', due_date: '' });
    setShowForm(false);
  };

  // Group tasks by employee for CEO view
  const groupedTasks = isCEO
    ? tasks.reduce((acc, t) => {
        const key = t.employee ? `${t.employee.first_name} ${t.employee.last_name}` : 'Non assigne';
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {} as Record<string, typeof tasks>)
    : { 'Mes taches': tasks };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: DL.text.primary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          Gantt
        </h1>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '8px 16px', background: `${DL.gold400}15`, color: DL.gold400,
          border: `1px solid ${DL.gold400}30`, borderRadius: 8, fontSize: 12,
          fontWeight: 600, cursor: 'pointer',
        }}>+ Tache</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
          borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input type="text" placeholder="Titre *" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12, outline: 'none' }}
            />
            <input type="date" value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}
            />
            <input type="date" value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              style={{ padding: '10px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
              style={{ padding: '8px 12px', background: DL.surface, border: `1px solid ${DL.glassBorder}`, borderRadius: 8, color: DL.text.primary, fontSize: 12 }}>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
            </select>
            <button onClick={handleCreate} style={{
              padding: '8px 20px', background: DL.gold400, color: '#05080d', border: 'none',
              borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>Creer</button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {Object.entries(PRIORITY_COLORS).map(([k, c]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 10, color: DL.text.muted, textTransform: 'capitalize' }}>{k === 'low' ? 'Basse' : k === 'medium' ? 'Moyenne' : 'Haute'}</span>
          </div>
        ))}
      </div>

      {/* Gantt chart */}
      <div style={{
        background: DL.elevated, border: `1px solid ${DL.glassBorder}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Timeline header */}
        <div style={{
          position: 'relative', height: 32, borderBottom: `1px solid ${DL.glassBorder}`,
          background: DL.surface,
        }}>
          {months.map((m, i) => (
            <div key={i} style={{
              position: 'absolute', left: m.left, top: 0, height: '100%',
              borderLeft: `1px solid ${DL.glassBorder}`, paddingLeft: 6,
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, color: DL.text.muted }}>{m.label}</span>
            </div>
          ))}
          {/* Today marker */}
          <div style={{
            position: 'absolute',
            left: `${((now.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100}%`,
            top: 0, bottom: 0, width: 1, background: '#ef4444', zIndex: 2,
          }} />
        </div>

        {/* Task rows */}
        {Object.entries(groupedTasks).map(([group, groupTasks]) => (
          <div key={group}>
            {isCEO && (
              <div style={{
                padding: '8px 14px', fontSize: 11, fontWeight: 700,
                color: DL.text.secondary, background: DL.surface,
                borderBottom: `1px solid ${DL.glassBorder}`,
              }}>{group}</div>
            )}
            {groupTasks.map(task => {
              const bar = getBarPosition(task.start_date, task.due_date);
              const color = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', height: 40,
                  borderBottom: `1px solid ${DL.glassBorder}`,
                }}>
                  {/* Task name */}
                  <div style={{
                    width: 180, flexShrink: 0, padding: '0 12px',
                    fontSize: 11, color: DL.text.primary, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    <span style={{
                      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                      background: STATUS_COLORS[task.status] || '#64748b', marginRight: 6,
                    }} />
                    {task.title}
                  </div>
                  {/* Bar area */}
                  <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                    <div style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      left: bar.left, width: bar.width, height: 16,
                      background: `${color}40`, borderRadius: 4,
                      border: `1px solid ${color}60`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {tasks.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: DL.text.muted, fontSize: 13 }}>
            Aucune tache — creez votre premiere tache
          </div>
        )}
      </div>
    </div>
  );
}
