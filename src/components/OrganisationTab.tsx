import { FormEvent, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, ListChecks, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AgendaEvent, MONTHS, Task, TaskPriority, WEEKDAYS } from '@/types';

type Props = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  flash: (msg: string) => void;
};

export function OrganisationTab({ tasks, setTasks, flash }: Props) {
  return (
    <>
      <AgendaSection flash={flash} />
      <TasksSection tasks={tasks} setTasks={setTasks} flash={flash} />
    </>
  );
}

// ===== AGENDA (monthly calendar) =====
function AgendaSection({ flash }: { flash: (msg: string) => void }) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [viewDate, setViewDate] = useState(new Date());
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventColor, setEventColor] = useState('#3B82F6');
  const [loaded, setLoaded] = useState(false);

  const loadEvents = async () => {
    const { data } = await supabase.from('agenda_events').select('id, title, weekday, start_time, end_time, color, event_date').order('start_time');
    if (data) setEvents(data as AgendaEvent[]);
    setLoaded(true);
  };
  if (!loaded) void loadEvents();

  const calendarDays = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(y, m, -i);
      days.push({ dateStr: d.toISOString().slice(0, 10), dayNum: d.getDate(), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      const isoStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: isoStr, dayNum: i, isCurrentMonth: true });
    }
    return days;
  }, [viewDate]);

  const addEvent = async (dateStr: string) => {
    const title = eventTitle.trim();
    if (!title) return;
    const d = new Date(dateStr + 'T12:00:00');
    const weekday = (d.getDay() + 6) % 7;
    const { data, error } = await supabase.from('agenda_events').insert({ title, weekday, start_time: eventTime || null, color: eventColor, event_date: dateStr }).select('id, title, weekday, start_time, end_time, color, event_date').single();
    if (error || !data) { flash('Événement non ajouté.'); return; }
    setEvents((c) => [...c, data as AgendaEvent].sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '')));
    setEventTitle(''); setEventTime(''); setAddingDate(null);
    flash('Événement ajouté');
  };

  const removeEvent = async (id: string) => {
    const { error } = await supabase.from('agenda_events').delete().eq('id', id);
    if (!error) setEvents((c) => c.filter((e) => e.id !== id));
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <section className="card" style={{ padding: '28px 30px' }}>
      <div className="card-heading">
        <div><p className="label">Planning</p><h2>Agenda</h2></div>
        <div className="agenda-nav">
          <button className="icon-button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
          <strong className="agenda-current-month">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
          <button className="icon-button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="agenda-weekdays-row">
        {WEEKDAYS.map((d) => <span key={d}>{d.slice(0, 3)}</span>)}
      </div>

      <div className="agenda-month-grid">
        {calendarDays.map((d, idx) => {
          const dayEvents = events.filter((e) => e.event_date === d.dateStr);
          const isToday = d.dateStr === todayStr;
          return (
            <div className={`agenda-month-day ${!d.isCurrentMonth ? 'muted' : ''} ${isToday ? 'today' : ''}`} key={idx}>
              <span className="agenda-month-day-num">{d.dayNum}</span>
              {dayEvents.map((ev) => (
                <div className="agenda-month-event" key={ev.id} style={{ borderLeftColor: ev.color }}>
                  <span>{ev.start_time ? `${ev.start_time} ` : ''}{ev.title}</span>
                  <button className="agenda-event-del" onClick={() => void removeEvent(ev.id)}><Trash2 size={10} /></button>
                </div>
              ))}
              {addingDate === d.dateStr ? (
                <div className="agenda-event-form">
                  <input placeholder="Titre" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} autoFocus />
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  <input type="color" value={eventColor} onChange={(e) => setEventColor(e.target.value)} style={{ height: 32 }} />
                  <div className="agenda-event-form-buttons">
                    <button className="save" onClick={() => void addEvent(d.dateStr)}>OK</button>
                    <button className="cancel" onClick={() => setAddingDate(null)}>×</button>
                  </div>
                </div>
              ) : (
                <button className="agenda-month-add" onClick={() => { setAddingDate(d.dateStr); setEventTitle(''); setEventTime(''); }}><Plus size={10} /></button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ===== TO-DO LIST =====
function TasksSection({ tasks, setTasks, flash }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>>; flash: (msg: string) => void }) {
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newRecurring, setNewRecurring] = useState(false);
  const [newRecurrence, setNewRecurrence] = useState<'weekly' | 'monthly'>('weekly');
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'done'>('all');

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const { data, error } = await supabase.from('tasks').insert({ title, priority: newPriority, is_recurring: newRecurring, recurrence: newRecurring ? newRecurrence : null }).select('id, title, priority, done, is_recurring, recurrence').single();
    if (error || !data) { flash('Tâche non ajoutée.'); return; }
    setTasks((c) => [...c, data as Task]);
    setNewTitle('');
    flash('Tâche ajoutée');
  };

  const toggleTask = async (id: string, done: boolean) => {
    const { error } = await supabase.from('tasks').update({ done: !done }).eq('id', id);
    if (error) return;
    setTasks((c) => c.map((t) => t.id === id ? { ...t, done: !done } : t));
  };

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks((c) => c.filter((t) => t.id !== id));
  };

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const filtered = tasks
    .filter((t) => filter === 'all' ? !t.done : filter === 'done' ? t.done : !t.done && t.priority === filter)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const priorityLabel = { high: 'Haute', medium: 'Moyenne', low: 'Basse' };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDone = tasks.filter((t) => t.done).length;
  const todayTotal = tasks.length;
  const productivityPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  return (
    <section className="card" style={{ padding: '28px 30px', marginTop: 20 }}>
      <div className="card-heading">
        <div><p className="label">À faire</p><h2>To-do list</h2></div>
        <div className="productivity-badge">
          <ListChecks size={15} />
          <span>{todayDone}/{todayTotal}</span>
          <strong>{productivityPct}%</strong>
        </div>
      </div>

      <div className="productivity-bar">
        <div className="productivity-bar-fill" style={{ width: `${productivityPct}%` }} />
      </div>

      <form className="task-add-form" onSubmit={addTask}>
        <input placeholder="Nouvelle tâche..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)}>
          <option value="high">Priorité haute</option>
          <option value="medium">Priorité moyenne</option>
          <option value="low">Priorité basse</option>
        </select>
        <label className="recurring-task-check">
          <input type="checkbox" checked={newRecurring} onChange={(e) => setNewRecurring(e.target.checked)} />
          <RefreshCw size={13} /> Récurrente
        </label>
        {newRecurring && (
          <select value={newRecurrence} onChange={(e) => setNewRecurrence(e.target.value as 'weekly' | 'monthly')}>
            <option value="weekly">Hebdo</option>
            <option value="monthly">Mensuel</option>
          </select>
        )}
        <button className="primary-button" type="submit"><Plus size={16} /> Ajouter</button>
      </form>

      <div className="task-filters" style={{ marginTop: 16 }}>
        <button className={`task-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Toutes</button>
        <button className={`task-filter-btn ${filter === 'high' ? 'active' : ''}`} onClick={() => setFilter('high')}>Haute</button>
        <button className={`task-filter-btn ${filter === 'medium' ? 'active' : ''}`} onClick={() => setFilter('medium')}>Moyenne</button>
        <button className={`task-filter-btn ${filter === 'low' ? 'active' : ''}`} onClick={() => setFilter('low')}>Basse</button>
        <button className={`task-filter-btn ${filter === 'done' ? 'active' : ''}`} onClick={() => setFilter('done')}>Terminées</button>
      </div>

      {filtered.length === 0 ? (
        <div className="tab-empty"><Check size={28} /><p>Aucune tâche ici.</p></div>
      ) : (
        <div className="task-list">
          {filtered.map((task) => (
            <div className={`task-item ${task.done ? 'done' : ''}`} key={task.id}>
              <button className={`task-check ${task.done ? 'checked' : ''}`} onClick={() => void toggleTask(task.id, task.done)} aria-label="Cocher">
                {task.done && <Check size={14} />}
              </button>
              <div className="task-content">
                <div className="task-title">{task.title}</div>
                {task.is_recurring && task.recurrence && (
                  <span className="task-recurring-pill"><RefreshCw size={9} /> {task.recurrence === 'weekly' ? 'Hebdomadaire' : 'Mensuel'}</span>
                )}
              </div>
              <span className={`task-priority ${task.priority}`}>{priorityLabel[task.priority]}</span>
              <button className="task-delete" onClick={() => void removeTask(task.id)} aria-label="Supprimer"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
