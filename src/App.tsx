import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download, Edit3, Gamepad2, ListTodo, MoreHorizontal, Moon, PiggyBank, Plus, RefreshCw, Settings2, Sun, Tag, Target, Trash2, TrendingUp, Wallet, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Category, Dream, EntryType, Expense, formatMoney, formatDate, formatDateFull, MONTHS, PALETTE, Period, Skill, SavingsGoal, Task, today } from '@/types';
import { OrganisationTab } from '@/components/OrganisationTab';
import { ProgressionTab } from '@/components/ProgressionTab';

type Tab = 'budget' | 'organisation' | 'progression';

const HIDDEN_AMOUNT = '•••• €';

const initials = (name: string) => name.trim().slice(0, 2).toUpperCase() || 'ML';
const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

function App() {
  const [tab, setTab] = useState<Tab>('budget');
  const [categories, setCategories] = useState<Category[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detailEntry, setDetailEntry] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [expenseDate, setExpenseDate] = useState(today());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerViewDate, setPickerViewDate] = useState(new Date());
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [isRecurring, setIsRecurring] = useState(false);
  const [note, setNote] = useState('');
  const [savingsGoalId, setSavingsGoalId] = useState('');
  const [showInlineGoal, setShowInlineGoal] = useState(false);
  const [inlineGoalName, setInlineGoalName] = useState('');
  const [inlineGoalTarget, setInlineGoalTarget] = useState('');
  const [inlineGoalColor, setInlineGoalColor] = useState(PALETTE[0]);
  const [evolutionRange, setEvolutionRange] = useState<'7days' | 'month' | '6months' | 'year'>('6months');
  const [showInlineCategory, setShowInlineCategory] = useState(false);
  const [inlineName, setInlineName] = useState('');
  const [inlineColor, setInlineColor] = useState(PALETTE[0]);
  const [firstName, setFirstName] = useState('Marie');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInput, setProfileInput] = useState('Marie');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [budgetInput, setBudgetInput] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [balanceAlertEnabled, setBalanceAlertEnabled] = useState(false);
  const [balanceThreshold, setBalanceThreshold] = useState(0);
  const [thresholdInput, setThresholdInput] = useState('');

  useEffect(() => {
    const storedName = localStorage.getItem('clair.firstName');
    if (storedName) { setFirstName(storedName); setProfileInput(storedName); }
    const storedTheme = localStorage.getItem('clair.theme');
    if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);
    const storedBudget = localStorage.getItem('clair.monthlyBudget');
    if (storedBudget) { setMonthlyBudget(Number(storedBudget)); setBudgetInput(storedBudget); }
    const storedThreshold = localStorage.getItem('clair.balanceThreshold');
    if (storedThreshold) { setBalanceThreshold(Number(storedThreshold)); setThresholdInput(storedThreshold); setBalanceAlertEnabled(true); }
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('clair.theme', next);
  };

  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2400); };
  const fmt = (v: number) => isHidden ? HIDDEN_AMOUNT : formatMoney(v);
  const balanceBelowThreshold = balanceAlertEnabled && balance < balanceThreshold;

  const loadData = async () => {
    setIsLoading(true);
    const [cat, exp, goals, sk, dre, tsk] = await Promise.all([
      supabase.from('budget_categories').select('id, name, color').order('created_at'),
      supabase.from('budget_expenses').select('id, amount, category_id, expense_date, entry_type, is_recurring, savings_goal_id, note').order('expense_date', { ascending: false }).limit(300),
      supabase.from('savings_goals').select('id, name, target_amount, color').order('created_at'),
      supabase.from('skills').select('id, name, level, color, icon').order('created_at'),
      supabase.from('dreams').select('id, title, solution, color').order('created_at'),
      supabase.from('tasks').select('id, title, priority, done, is_recurring, recurrence').order('created_at'),
    ]);
    if (cat.error || exp.error || goals.error) {
      setNotice('Les données ne peuvent pas être chargées pour le moment.');
    } else {
      setCategories(cat.data ?? []);
      setExpenses((exp.data ?? []) as Expense[]);
      setSavingsGoals(goals.data ?? []);
      if (!categoryId && cat.data?.[0]) setCategoryId(cat.data[0].id);
    }
    if (!sk.error) setSkills(sk.data ?? []);
    if (!dre.error) setDreams(dre.data ?? []);
    if (!tsk.error) setTasks(tsk.data ?? []);
    setIsLoading(false);
  };

  useEffect(() => { void loadData(); }, []);

  const now = new Date();

  const yearExpenses = useMemo(() => expenses.filter((e) => new Date(`${e.expense_date}T12:00:00`).getFullYear() === now.getFullYear()), [expenses, now]);

  const visibleExpenses = useMemo(() => {
    if (period === 'month') {
      const month = selectedMonth ?? now.getMonth();
      return yearExpenses.filter((e) => new Date(`${e.expense_date}T12:00:00`).getMonth() === month);
    }
    return yearExpenses;
  }, [yearExpenses, period, selectedMonth, now]);

  const monthTotals = useMemo(() => MONTHS.map((label, index) => {
    const monthEntries = yearExpenses.filter((e) => new Date(`${e.expense_date}T12:00:00`).getMonth() === index);
    return { label, index, total: monthEntries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0) };
  }), [yearExpenses]);

  const yearExpenseTotal = yearExpenses.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const visibleExpensesOnly = visibleExpenses.filter((e) => e.entry_type === 'expense');
  const visibleIncomeOnly = visibleExpenses.filter((e) => e.entry_type === 'income');
  const visibleSavingsOnly = visibleExpenses.filter((e) => e.entry_type === 'savings');
  const totalSpent = visibleExpensesOnly.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = visibleIncomeOnly.reduce((s, e) => s + Number(e.amount), 0);
  const totalSavings = visibleSavingsOnly.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalSpent - totalSavings;

  const grouped = categories.map((category) => ({
    ...category,
    total: visibleExpensesOnly.filter((e) => e.category_id === category.id).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  const uncategorizedTotal = visibleExpensesOnly.filter((e) => !e.category_id).reduce((s, e) => s + Number(e.amount), 0);
  const donut = grouped.length ? grouped.map((item, index) => `${item.color} ${index === 0 ? 0 : grouped.slice(0, index).reduce((s, p) => s + p.total, 0) / totalSpent * 100}% ${(grouped.slice(0, index + 1).reduce((s, p) => s + p.total, 0) / totalSpent) * 100}%`).join(', ') : 'var(--border) 0% 100%';
  const recentEntries = [...visibleExpenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date)).slice(0, 8);
  const activeMonth = selectedMonth ?? now.getMonth();
  const periodLabel = period === 'month' ? `${MONTHS[activeMonth]} ${now.getFullYear()}` : String(now.getFullYear());
  const maxMonthTotal = Math.max(...monthTotals.map((m) => m.total), 1);

  const budgetRatio = monthlyBudget > 0 ? totalSpent / monthlyBudget : 0;
  const budgetLevel = budgetRatio >= 1 ? 'red' : budgetRatio >= 0.8 ? 'orange' : 'green';
  const budgetRemaining = monthlyBudget - totalSpent;

  const evolutionData = useMemo(() => {
    const buckets: { label: string; expense: number; income: number }[] = [];
    if (evolutionRange === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayEntries = expenses.filter((e) => e.expense_date === key);
        buckets.push({ label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d), expense: dayEntries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0), income: dayEntries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0) });
      }
    } else if (evolutionRange === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const key = d.toISOString().slice(0, 10);
        const dayEntries = expenses.filter((e) => e.expense_date === key);
        buckets.push({ label: String(i), expense: dayEntries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0), income: dayEntries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0) });
      }
    } else if (evolutionRange === '6months') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEntries = expenses.filter((e) => { const ed = new Date(`${e.expense_date}T12:00:00`); return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear(); });
        buckets.push({ label: MONTHS[d.getMonth()].slice(0, 3), expense: monthEntries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0), income: monthEntries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0) });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEntries = expenses.filter((e) => { const ed = new Date(`${e.expense_date}T12:00:00`); return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear(); });
        buckets.push({ label: MONTHS[d.getMonth()].slice(0, 3), expense: monthEntries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount), 0), income: monthEntries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0) });
      }
    }
    return buckets;
  }, [expenses, now, evolutionRange]);

  const maxEvolution = Math.max(...evolutionData.map((d) => Math.max(d.expense, d.income)), 1);
  const evolutionTitle = evolutionRange === '7days' ? '7 derniers jours' : evolutionRange === 'month' ? MONTHS[now.getMonth()] : evolutionRange === '6months' ? '6 derniers mois' : '12 derniers mois';
  const showEveryNth = evolutionData.length > 12 ? Math.ceil(evolutionData.length / 12) : 1;

  const savingsProjectionAmount = Number(amount.replace(',', '.')) || 0;

  const goalProgress = useMemo(() => savingsGoals.map((goal) => {
    const saved = expenses.filter((e) => e.entry_type === 'savings' && e.savings_goal_id === goal.id).reduce((s, e) => s + Number(e.amount), 0);
    const target = Number(goal.target_amount) || 0;
    const ratio = target > 0 ? Math.min(saved / target, 1) : 0;
    return { ...goal, saved, target, ratio, remaining: Math.max(target - saved, 0) };
  }), [savingsGoals, expenses]);

  const addExpense = async (event: FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount.replace(',', '.'));
    if (!numericAmount || numericAmount <= 0 || !expenseDate) return;
    const { data, error } = await supabase.from('budget_expenses').insert({ amount: numericAmount, category_id: categoryId || null, expense_date: expenseDate, entry_type: entryType, is_recurring: isRecurring, savings_goal_id: entryType === 'savings' ? (savingsGoalId || null) : null, note: note.trim() || null }).select('id, amount, category_id, expense_date, entry_type, is_recurring, savings_goal_id, note').single();
    if (error || !data) { flash("Cette entrée n'a pas pu être ajoutée."); return; }
    setExpenses((current) => [data as Expense, ...current]);
    setAmount(''); setIsRecurring(false); setNote('');
    flash(entryType === 'income' ? 'Revenu ajouté' : entryType === 'savings' ? 'Épargne ajoutée' : 'Dépense ajoutée');
  };

  const removeExpense = async (id: string) => {
    const { error } = await supabase.from('budget_expenses').delete().eq('id', id);
    if (!error) setExpenses((current) => current.filter((e) => e.id !== id));
    setMenuId(null);
  };

  const createCategory = async (name: string, color: string): Promise<Category | null> => {
    const { data, error } = await supabase.from('budget_categories').insert({ name, color }).select('id, name, color').single();
    if (error || !data) { flash("Cette catégorie n'a pas pu être créée."); return null; }
    setCategories((current) => [...current, data]);
    return data;
  };

  const submitInlineCategory = async () => {
    const name = inlineName.trim();
    if (!name) return;
    const created = await createCategory(name, inlineColor);
    if (created) {
      setCategoryId(created.id);
      setShowInlineCategory(false);
      setInlineName('');
      setInlineColor(PALETTE[(categories.length + 1) % PALETTE.length]);
      flash('Catégorie créée');
    }
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const color = String(form.get('color') ?? '#F59E0B');
    if (!name) return;
    if (editingCategory?.id) {
      const { data, error } = await supabase.from('budget_categories').update({ name, color }).eq('id', editingCategory.id).select('id, name, color').single();
      if (!error && data) setCategories((current) => current.map((c) => c.id === data.id ? data : c));
    } else {
      await createCategory(name, color);
    }
    setEditingCategory(null);
  };

  const removeCategory = async (id: string) => {
    const { error } = await supabase.from('budget_categories').delete().eq('id', id);
    if (!error) setCategories((current) => current.filter((c) => c.id !== id));
    setEditingCategory(null);
  };

  const handleCategorySelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === '__create__') { setShowInlineCategory(true); event.target.value = categoryId; return; }
    setCategoryId(event.target.value);
  };

  const handleGoalSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value === '__create__') { setShowInlineGoal(true); event.target.value = savingsGoalId; return; }
    setSavingsGoalId(event.target.value);
  };

  const submitInlineGoal = async () => {
    const name = inlineGoalName.trim();
    const target = Number(inlineGoalTarget.replace(',', '.')) || 0;
    if (!name) return;
    const { data, error } = await supabase.from('savings_goals').insert({ name, target_amount: target, color: inlineGoalColor }).select('id, name, target_amount, color').single();
    if (error || !data) { flash("Cette tirelire n'a pas pu être créée."); return; }
    setSavingsGoals((current) => [...current, data]);
    setSavingsGoalId(data.id);
    setShowInlineGoal(false);
    setInlineGoalName(''); setInlineGoalTarget('');
    setInlineGoalColor(PALETTE[(savingsGoals.length + 1) % PALETTE.length]);
    flash('Tirelire créée');
  };

  const removeGoal = async (id: string) => {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (!error) setSavingsGoals((current) => current.filter((g) => g.id !== id));
  };

  const selectMonth = (index: number) => { setSelectedMonth(index); setPeriod('month'); };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const name = profileInput.trim() || 'Marie';
    setFirstName(name);
    localStorage.setItem('clair.firstName', name);
    setIsProfileOpen(false);
  };

  const saveBudget = () => {
    const value = Number(budgetInput.replace(',', '.')) || 0;
    setMonthlyBudget(value);
    localStorage.setItem('clair.monthlyBudget', String(value));
    setIsEditingBudget(false);
    flash('Budget mis à jour');
  };

  const exportCsv = () => {
    const rows = [['Date', 'Type', 'Montant', 'Catégorie', 'Récurrent', 'Note']];
    [...visibleExpenses].sort((a, b) => a.expense_date.localeCompare(b.expense_date)).forEach((e) => {
      const cat = categories.find((c) => c.id === e.category_id)?.name ?? 'Sans catégorie';
      rows.push([e.expense_date, e.entry_type === 'income' ? 'Revenu' : e.entry_type === 'savings' ? 'Épargne' : 'Dépense', String(e.amount).replace('.', ','), cat, e.is_recurring ? 'Oui' : 'Non', e.note ?? '']);
    });
    const csv = rows.map((r) => r.map(escapeCsv).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget_${periodLabel.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    flash('Export CSV téléchargé');
  };

  const calendarDays = useMemo(() => {
    const y = pickerViewDate.getFullYear();
    const m = pickerViewDate.getMonth();
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
  }, [pickerViewDate]);

  const detailCategory = detailEntry ? categories.find((c) => c.id === detailEntry.category_id) : null;
  const detailGoal = detailEntry ? savingsGoals.find((g) => g.id === detailEntry.savings_goal_id) : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><PiggyBank size={21} strokeWidth={2.4} /></span><span>THE 1%</span></div>
        <div className="topbar-right">
          <span className="sync-status"><span className="sync-dot" /> Données à jour</span>
          <button className="theme-toggle" aria-label="Masquer/Afficher les montants" onClick={() => setIsHidden(!isHidden)}>{isHidden ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          <button className="theme-toggle" aria-label="Changer de thème" onClick={toggleTheme}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
          <button className="icon-button" aria-label="Gérer les catégories" onClick={() => setIsCategoryPanelOpen(true)}><Settings2 size={19} /></button>
          <button className="profile-button" aria-label="Ouvrir le profil" onClick={() => { setProfileInput(firstName); setIsProfileOpen(true); }}>
            <div className="avatar">{initials(firstName)}</div>
          </button>
        </div>
      </header>

      <section className="hero-row">
        <div>
          <p className="eyebrow">THE 1% — Votre espace personnel</p>
          <h1>Bonjour, {firstName}<span className="accent">.</span></h1>
          <p className="subtitle">Budget, compétences et objectifs — tout au même endroit.</p>
        </div>
        <div className="period-switch" role="group" aria-label="Période du graphique">
          <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mois</button>
          <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Année</button>
        </div>
      </section>

      <nav className="tab-nav">
        <button className={tab === 'budget' ? 'active' : ''} onClick={() => setTab('budget')}><Wallet size={16} /> <span>Budget</span></button>
        <button className={tab === 'organisation' ? 'active' : ''} onClick={() => setTab('organisation')}><CalendarDays size={16} /> <span>Organisation</span></button>
        <button className={tab === 'progression' ? 'active' : ''} onClick={() => setTab('progression')}><TrendingUp size={16} /> <span>Progression</span></button>
      </nav>

      {notice && <div className="notice">{notice}</div>}

      {/* ===== TAB 1: BUDGET ===== */}
      {tab === 'budget' && (
        <>
          {period === 'month' && (
            <>
              <section className="overview-grid">
                <div className="card chart-card">
                  <div className="card-heading">
                    <div>
                      <p className="label">Dépenses de {periodLabel}</p>
                      <div className="total">{fmt(totalSpent)}</div>
                    </div>
                    <span className="trend"><ArrowUpRight size={15} /> Suivi en direct</span>
                  </div>
                  <div className="chart-area">
                    <div className="donut" style={{ background: `conic-gradient(${donut})` }}>
                      <div className="donut-hole"><span>Total dépensé</span><strong>{fmt(totalSpent)}</strong></div>
                    </div>
                    <div className="legend">
                      {grouped.map((item) => <div className="legend-item" key={item.id}><span className="legend-color" style={{ backgroundColor: item.color }} /><span>{item.name}</span><strong>{Math.round(item.total / totalSpent * 100)}%</strong></div>)}
                      {uncategorizedTotal > 0 && <div className="legend-item"><span className="legend-color" style={{ backgroundColor: 'var(--text-3)' }} /><span>Autre</span><strong>{Math.round(uncategorizedTotal / totalSpent * 100)}%</strong></div>}
                      {!grouped.length && !isLoading && <p className="empty-copy">Ajoutez votre première dépense pour voir votre répartition.</p>}
                    </div>
                  </div>
                </div>
                <div className="side-stack">
                  <div className={`card balance-card ${balanceBelowThreshold ? 'balance-alert' : ''}`}>
                    <p className="label">Solde du mois</p>
                    <div className={`balance-amount ${balance >= 0 ? 'positive' : 'negative'}`}>{balance >= 0 ? '+' : ''}{fmt(balance)}</div>
                    {balanceBelowThreshold && (
                      <div className="balance-alert-banner"><AlertTriangle size={14} /> Solde sous le seuil de sécurité ({fmt(balanceThreshold)})</div>
                    )}
                    <div className="balance-detail">
                      <div>Revenus<strong style={{ color: 'var(--good)' }}>{fmt(totalIncome)}</strong></div>
                      <div>Dépenses<strong style={{ color: 'var(--bad)' }}>{fmt(totalSpent)}</strong></div>
                      <div>Épargne<strong style={{ color: 'var(--accent)' }}>{fmt(totalSavings)}</strong></div>
                    </div>
                    <div className="balance-threshold-row">
                      <label className="recurring-check"><input type="checkbox" checked={balanceAlertEnabled} onChange={(e) => { setBalanceAlertEnabled(e.target.checked); if (!e.target.checked) { localStorage.removeItem('clair.balanceThreshold'); } }} /><AlertTriangle size={13} /> Alerte seuil</label>
                      {balanceAlertEnabled && (
                        <div className="budget-edit">
                          <input type="number" inputMode="decimal" placeholder="Seuil €" value={thresholdInput} onChange={(e) => setThresholdInput(e.target.value)} onBlur={() => { const v = Number(thresholdInput.replace(',', '.')) || 0; setBalanceThreshold(v); localStorage.setItem('clair.balanceThreshold', String(v)); }} />
                        </div>
                      )}
                    </div>
                  </div>
                  {monthlyBudget > 0 ? (
                    <div className="card budget-card">
                      <div className="budget-row">
                        <strong>Budget mensuel</strong>
                        {!isEditingBudget ? (
                          <button className="text-button" onClick={() => { setBudgetInput(String(monthlyBudget)); setIsEditingBudget(true); }}><Edit3 size={13} /> Modifier</button>
                        ) : (
                          <div className="budget-edit">
                            <input type="number" inputMode="decimal" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} autoFocus />
                            <button className="icon-button" onClick={saveBudget} aria-label="Enregistrer"><ArrowUpRight size={18} /></button>
                          </div>
                        )}
                      </div>
                      <div className="budget-bar"><div className={`budget-bar-fill ${budgetLevel}`} style={{ width: `${Math.min(budgetRatio * 100, 100)}%` }} /></div>
                      <div className="budget-stats">
                        <span>{fmt(totalSpent)} / {fmt(monthlyBudget)}</span>
                        <span>{budgetRemaining >= 0 ? `${fmt(budgetRemaining)} restant` : `${fmt(-budgetRemaining)} dépassé`}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="card budget-card">
                      <p className="label">Budget mensuel</p>
                      <p className="empty-copy" style={{ marginBottom: '14px' }}>Définissez un plafond pour suivre vos dépenses.</p>
                      <div className="budget-edit">
                        <input type="number" inputMode="decimal" placeholder="0 €" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} />
                        <button className="ghost-button" onClick={saveBudget}>Définir</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="card evolution-card">
                <div className="card-heading">
                  <div><p className="label">Évolution</p><h2>{evolutionTitle}</h2></div>
                  <div className="range-tabs">
                    <button className={evolutionRange === '7days' ? 'active' : ''} onClick={() => setEvolutionRange('7days')}>7 jours</button>
                    <button className={evolutionRange === 'month' ? 'active' : ''} onClick={() => setEvolutionRange('month')}>Ce mois</button>
                    <button className={evolutionRange === '6months' ? 'active' : ''} onClick={() => setEvolutionRange('6months')}>6 mois</button>
                    <button className={evolutionRange === 'year' ? 'active' : ''} onClick={() => setEvolutionRange('year')}>Année</button>
                  </div>
                </div>
                <svg className="evolution-chart" viewBox="0 0 600 140" preserveAspectRatio="xMidYMid meet">
                  {[0, 1, 2, 3].map((i) => <line key={i} x1="0" y1={i * 30 + 5} x2="600" y2={i * 30 + 5} stroke="var(--border)" strokeWidth="1" />)}
                  {evolutionData.map((d, i) => {
                    const count = evolutionData.length;
                    const x = (i + 0.5) * (600 / count);
                    const barW = Math.max(5, Math.min(24, 600 / count * 0.35));
                    const expH = (d.expense / maxEvolution) * 100;
                    const incH = (d.income / maxEvolution) * 100;
                    const showLabel = i % showEveryNth === 0 || i === count - 1;
                    return (
                      <g key={i}>
                        <rect x={x - barW - 2} y={110 - expH} width={barW} height={expH} rx="3" fill="var(--bad)" opacity="0.85" />
                        <rect x={x + 2} y={110 - incH} width={barW} height={incH} rx="3" fill="var(--good)" opacity="0.85" />
                        {showLabel && <text x={x} y="128" textAnchor="middle" fontSize="9" fill="var(--text-3)">{d.label}</text>}
                      </g>
                    );
                  })}
                </svg>
                <div className="evo-legend">
                  <span><i style={{ background: 'var(--bad)' }} /> Dépenses</span>
                  <span><i style={{ background: 'var(--good)' }} /> Revenus</span>
                </div>
              </section>
            </>
          )}

          {period === 'year' && (
            <section className="card year-card">
              <div className="card-heading">
                <div>
                  <p className="label">Dépenses de {periodLabel}</p>
                  <div className="total">{fmt(yearExpenseTotal)}</div>
                </div>
                <span className="trend"><CalendarDays size={15} /> Vue annuelle</span>
              </div>
              <p className="year-hint">Cliquez sur un mois pour voir le détail.</p>
              <div className="months-grid">
                {monthTotals.map((month) => {
                  const isActive = selectedMonth === month.index;
                  const isCurrent = month.index === now.getMonth();
                  return (
                    <button key={month.index} className={`month-tile ${month.total > 0 ? 'has-data' : ''} ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`} onClick={() => selectMonth(month.index)}>
                      <div className="month-bar"><span style={{ height: `${Math.max(month.total / maxMonthTotal * 100, 4)}%`, backgroundColor: month.total > 0 ? 'var(--accent)' : 'var(--border)' }} /></div>
                      <span className="month-name">{month.label.slice(0, 3)}</span>
                      <strong>{month.total > 0 ? fmt(month.total) : '—'}</strong>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="content-grid">
            <div className="card add-card" style={{ zIndex: 30, position: 'relative' }}>
              <div className="card-heading"><div><p className="label">Nouvelle entrée</p><h2>Ajouter rapidement</h2></div><span className="plus-badge"><Plus size={18} /></span></div>
              <form onSubmit={addExpense}>
                <div className="type-switch">
                  <button type="button" className={`expense ${entryType === 'expense' ? 'active' : ''}`} onClick={() => setEntryType('expense')}><ArrowDownCircle size={15} /> Dépense</button>
                  <button type="button" className={`income ${entryType === 'income' ? 'active' : ''}`} onClick={() => setEntryType('income')}><ArrowUpCircle size={15} /> Revenu</button>
                  <button type="button" className={`savings ${entryType === 'savings' ? 'active' : ''}`} onClick={() => setEntryType('savings')}><PiggyBank size={15} /> Épargne</button>
                </div>
                <label>Montant<input inputMode="decimal" placeholder="0,00 €" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
                <label>Catégorie
                  <div className="select-wrap">
                    <select value={categoryId} onChange={handleCategorySelect}>
                      <option value="">Sans catégorie</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                      <option value="__create__" className="create-option">+ Créer une catégorie</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </label>
                {showInlineCategory && (
                  <div className="inline-category">
                    <div className="inline-title"><Tag size={14} /> Nouvelle catégorie</div>
                    <div className="inline-row">
                      <input placeholder="Nom de la catégorie" value={inlineName} onChange={(event) => setInlineName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void submitInlineCategory(); } }} autoFocus required />
                      <input type="color" value={inlineColor} onChange={(event) => setInlineColor(event.target.value)} aria-label="Couleur" />
                      <button type="button" className="primary-button compact-btn" onClick={submitInlineCategory}>Ajouter</button>
                      <button type="button" className="icon-button" aria-label="Annuler" onClick={() => setShowInlineCategory(false)}><X size={18} /></button>
                    </div>
                  </div>
                )}

                <label>Date
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="custom-date-trigger" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                      <CalendarDays size={17} />
                      <span>{expenseDate === today() ? "Aujourd'hui" : formatDateFull(expenseDate)}</span>
                    </button>
                    {isDatePickerOpen && (
                      <div className="custom-datepicker-popover">
                        <div className="datepicker-header">
                          <button type="button" className="icon-button" onClick={() => setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
                          <strong>{MONTHS[pickerViewDate.getMonth()]} {pickerViewDate.getFullYear()}</strong>
                          <button type="button" className="icon-button" onClick={() => setPickerViewDate(new Date(pickerViewDate.getFullYear(), pickerViewDate.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
                        </div>
                        <div className="datepicker-weekdays"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
                        <div className="datepicker-days">
                          {calendarDays.map((d, idx) => (
                            <button key={idx} type="button" className={`datepicker-day ${!d.isCurrentMonth ? 'muted' : ''} ${d.dateStr === expenseDate ? 'selected' : ''}`} onClick={() => { setExpenseDate(d.dateStr); setIsDatePickerOpen(false); }}>{d.dayNum}</button>
                          ))}
                        </div>
                        <div className="datepicker-footer"><button type="button" className="text-button" onClick={() => { setExpenseDate(today()); setIsDatePickerOpen(false); }}>Aujourd'hui</button></div>
                      </div>
                    )}
                  </div>
                </label>

                <label>Note / Description
                  <textarea className="note-input add-card-input" placeholder="Détail optionnel (ex: Restaurant avec Léa)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ width: '100%', marginTop: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', borderRadius: 10, padding: '10px 13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }} />
                </label>

                <label className="recurring-check"><input type="checkbox" checked={isRecurring} onChange={(event) => setIsRecurring(event.target.checked)} /><RefreshCw size={14} /> Récurrent mensuel</label>

                {entryType === 'savings' && (
                  <label>Tirelire
                    <div className="tirelire-select">
                      <div className="select-wrap" style={{ flex: 1 }}>
                        <select value={savingsGoalId} onChange={handleGoalSelect}>
                          <option value="">Sans tirelire</option>
                          {savingsGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}
                          <option value="__create__" className="create-option">+ Créer une tirelire</option>
                        </select>
                        <ChevronDown size={16} />
                      </div>
                      {savingsGoals.length > 0 && (
                        <button type="button" className="tirelire-add-btn" onClick={() => setShowInlineGoal(true)}><Plus size={14} /> Nouvelle</button>
                      )}
                    </div>
                  </label>
                )}

                {showInlineGoal && (
                  <div className="tirelire-inline">
                    <div className="inline-title"><Target size={14} /> Nouvelle tirelire</div>
                    <div className="tirelire-inline-row">
                      <input placeholder="Nom (ex: Voiture, Permis)" value={inlineGoalName} onChange={(e) => setInlineGoalName(e.target.value)} autoFocus />
                      <input inputMode="decimal" placeholder="Objectif €" value={inlineGoalTarget} onChange={(e) => setInlineGoalTarget(e.target.value)} style={{ maxWidth: 120 }} />
                      <input type="color" value={inlineGoalColor} onChange={(e) => setInlineGoalColor(e.target.value)} aria-label="Couleur" />
                      <button type="button" className="primary-button compact-btn" onClick={submitInlineGoal}>Créer</button>
                      <button type="button" className="icon-button" aria-label="Annuler" onClick={() => setShowInlineGoal(false)}><X size={18} /></button>
                    </div>
                  </div>
                )}

                {entryType === 'savings' && savingsProjectionAmount > 0 && isRecurring && (
                  <div className="savings-projection">
                    <div className="projection-title"><RefreshCw size={14} /> Projection de ton épargne</div>
                    <div className="projection-grid">
                      <div className="projection-item"><span>3 mois</span><strong>{fmt(savingsProjectionAmount * 3)}</strong></div>
                      <div className="projection-item"><span>6 mois</span><strong>{fmt(savingsProjectionAmount * 6)}</strong></div>
                      <div className="projection-item highlight"><span>1 an</span><strong>{fmt(savingsProjectionAmount * 12)}</strong></div>
                      <div className="projection-item"><span>2 ans</span><strong>{fmt(savingsProjectionAmount * 24)}</strong></div>
                    </div>
                    <p className="projection-hint">Basé sur {fmt(savingsProjectionAmount)}/mois récurrent.</p>
                  </div>
                )}
                {entryType === 'savings' && savingsProjectionAmount > 0 && !isRecurring && (
                  <div className="savings-projection">
                    <div className="projection-title">Versement unique</div>
                    <div className="projection-grid">
                      <div className="projection-item highlight"><span>Aujourd'hui</span><strong>{fmt(savingsProjectionAmount)}</strong></div>
                      <div className="projection-item"><span>Astuce</span><strong style={{ fontSize: 11 }}>Cochez « Récurrent » pour voir une projection</strong></div>
                    </div>
                  </div>
                )}
                <button className="primary-button" type="submit">{entryType === 'income' ? 'Ajouter le revenu' : entryType === 'savings' ? 'Mettre de côté' : 'Ajouter la dépense'} <ArrowUpRight size={17} /></button>
              </form>
            </div>
            <div className="card recent-card">
              <div className="card-heading">
                <div><p className="label">Activité récente</p><h2>Dernières entrées</h2></div>
                <button className="ghost-button" onClick={exportCsv}><Download size={15} /> CSV</button>
              </div>
              <div className="expense-list">
                {recentEntries.map((entry) => {
                  const category = categories.find((item) => item.id === entry.category_id);
                  const isIncome = entry.entry_type === 'income';
                  const isSavings = entry.entry_type === 'savings';
                  const goal = savingsGoals.find((g) => g.id === entry.savings_goal_id);
                  const entryColor = isIncome ? 'var(--good)' : isSavings ? (goal?.color ?? 'var(--accent)') : category?.color ?? 'var(--text-3)';
                  return (
                    <div className="expense-row" key={entry.id} style={{ cursor: 'pointer' }} onClick={() => setDetailEntry(entry)}>
                      <span className="expense-icon" style={{ backgroundColor: `${entryColor}1A`, color: entryColor }}>{isIncome ? '+' : isSavings ? '★' : category ? category.name.slice(0, 1).toUpperCase() : '?'}</span>
                      <div className="expense-info">
                        <strong>{isSavings && goal ? goal.name : category?.name ?? (isIncome ? 'Revenu' : isSavings ? 'Épargne' : 'Sans catégorie')}</strong>
                        <span>{formatDate(entry.expense_date)}{entry.is_recurring && <span className="recurring-pill"><RefreshCw size={9} /> Récurrent</span>}{entry.note && <span style={{ color: 'var(--text-3)' }}> · {entry.note.slice(0, 30)}{entry.note.length > 30 ? '…' : ''}</span>}</span>
                      </div>
                      <strong className={`expense-amount ${isIncome ? 'income' : ''} ${isSavings ? 'savings' : ''}`}>{isIncome ? '+' : isSavings ? '★' : '−'} {fmt(Number(entry.amount))}</strong>
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="more-button" onClick={() => setMenuId(menuId === entry.id ? null : entry.id)} aria-label="Actions"><MoreHorizontal size={18} /></button>
                        {menuId === entry.id && <button className="delete-float" onClick={() => void removeExpense(entry.id)}><Trash2 size={14} /> Supprimer</button>}
                      </div>
                    </div>
                  );
                })}
                {!recentEntries.length && <div className="empty-state"><CalendarDays size={22} /><p>Aucune entrée sur cette période.</p></div>}
              </div>
            </div>
          </section>

          {goalProgress.length > 0 && (
            <section className="card goals-card" style={{ marginTop: 20, padding: '28px 30px' }}>
              <div className="card-heading"><div><p className="label">Tirelires</p><h2>Vos objectifs d'épargne</h2></div></div>
              <div className="goals-grid">
                {goalProgress.map((goal) => (
                  <div className="goal-card" key={goal.id}>
                    <div className="goal-card-head">
                      <span className="goal-icon" style={{ backgroundColor: `${goal.color}1A`, color: goal.color }}><Target size={18} /></span>
                      <div style={{ flex: 1 }}>
                        <div className="goal-name">{goal.name}</div>
                        <div className="goal-sub">{goal.target > 0 ? `Objectif : ${fmt(goal.target)}` : 'Sans objectif défini'}</div>
                      </div>
                      <button className="goal-delete" onClick={() => void removeGoal(goal.id)} aria-label={`Supprimer ${goal.name}`}><Trash2 size={14} /></button>
                    </div>
                    {goal.target > 0 && (
                      <>
                        <div className="goal-bar"><div className="goal-bar-fill" style={{ width: `${goal.ratio * 100}%`, background: goal.color }} /></div>
                        <div className="goal-stats">
                          <span>{fmt(goal.saved)} épargné</span>
                          <span><strong>{Math.round(goal.ratio * 100)}%</strong></span>
                        </div>
                        <div className="goal-stats"><span>Reste <strong>{fmt(goal.remaining)}</strong> à économiser</span></div>
                      </>
                    )}
                    {goal.target === 0 && (
                      <div className="goal-stats"><span><strong>{fmt(goal.saved)}</strong> épargné au total</span></div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ===== TAB 2: ORGANISATION ===== */}
      {tab === 'organisation' && <OrganisationTab tasks={tasks} setTasks={setTasks} flash={flash} />}

      {/* ===== TAB 3: PROGRESSION ===== */}
      {tab === 'progression' && <ProgressionTab skills={skills} setSkills={setSkills} dreams={dreams} setDreams={setDreams} flash={flash} />}

      {/* ===== ENTRY DETAIL MODAL (centered pop-up) ===== */}
      {detailEntry && (
        <div className="modal-backdrop centered" onClick={() => setDetailEntry(null)}>
          <section className="modal centered-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><p className="label">{detailEntry.entry_type === 'income' ? 'Revenu' : detailEntry.entry_type === 'savings' ? 'Épargne' : 'Dépense'}</p><h2>Détail de l'opération</h2></div><button className="icon-button" onClick={() => setDetailEntry(null)}><X size={19} /></button></div>
            <div className="detail-row"><span>Montant</span><strong>{fmt(Number(detailEntry.amount))}</strong></div>
            <div className="detail-row"><span>Date</span><strong>{formatDateFull(detailEntry.expense_date)}</strong></div>
            <div className="detail-row"><span>Catégorie</span><strong>{detailCategory?.name ?? 'Sans catégorie'}</strong></div>
            {detailGoal && <div className="detail-row"><span>Tirelire</span><strong>{detailGoal.name}</strong></div>}
            <div className="detail-row"><span>Récurrent</span><strong>{detailEntry.is_recurring ? 'Oui' : 'Non'}</strong></div>
            {detailEntry.note && (
              <div style={{ marginTop: 16 }}>
                <span className="dream-solution-label">Note</span>
                <div className="entry-note">{detailEntry.note}</div>
              </div>
            )}
            <button className="ghost-button" style={{ marginTop: 20, width: '100%' }} onClick={() => { void removeExpense(detailEntry.id); setDetailEntry(null); }}><Trash2 size={15} /> Supprimer cette entrée</button>
          </section>
        </div>
      )}

      {/* ===== CATEGORY PANEL ===== */}
      {isCategoryPanelOpen && (
        <div className="modal-backdrop" onClick={() => setIsCategoryPanelOpen(false)}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><p className="label">Personnalisation</p><h2>Vos catégories</h2></div><button className="icon-button" onClick={() => setIsCategoryPanelOpen(false)}><X size={19} /></button></div>
            <div className="category-manage-list">
              {categories.map((category) => (
                <div className="manage-row" key={category.id}>
                  <span className="legend-color" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                  <div>
                    <button onClick={() => setEditingCategory(category)} aria-label={`Modifier ${category.name}`}><Edit3 size={15} /></button>
                    <button onClick={() => void removeCategory(category.id)} aria-label={`Supprimer ${category.name}`}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {!categories.length && <p className="empty-copy" style={{ padding: '24px 0' }}>Aucune catégorie pour l'instant.</p>}
            </div>
            {editingCategory?.id ? (
              <form className="category-form" onSubmit={saveCategory}>
                <div className="form-title">Modifier la catégorie</div>
                <input name="name" defaultValue={editingCategory.name} placeholder="Nom de la catégorie" required />
                <input name="color" type="color" defaultValue={editingCategory.color} />
                <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setEditingCategory(null)}>Annuler</button><button className="primary-button" type="submit">Enregistrer</button></div>
              </form>
            ) : (
              <button className="outline-button" onClick={() => setEditingCategory({ id: '', name: '', color: PALETTE[0] })}><Plus size={16} /> Ajouter une catégorie</button>
            )}
          </section>
        </div>
      )}

      {/* ===== PROFILE MODAL ===== */}
      {isProfileOpen && (
        <div className="modal-backdrop" onClick={() => setIsProfileOpen(false)}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><p className="label">Compte</p><h2>Votre prénom</h2></div><button className="icon-button" onClick={() => setIsProfileOpen(false)}><X size={19} /></button></div>
            <form onSubmit={saveProfile}>
              <label>Prénom<input value={profileInput} onChange={(e) => setProfileInput(e.target.value)} required /></label>
              <button className="primary-button" type="submit" style={{ marginTop: '16px' }}>Enregistrer</button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
