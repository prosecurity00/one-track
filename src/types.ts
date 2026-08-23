export type Category = { id: string; name: string; color: string };
export type SavingsGoal = { id: string; name: string; target_amount: number; color: string };
export type EntryType = 'expense' | 'income' | 'savings';
export type Expense = {
  id: string;
  amount: number;
  category_id: string | null;
  expense_date: string;
  entry_type: EntryType;
  is_recurring: boolean;
  savings_goal_id: string | null;
  note: string | null;
};
export type Period = 'month' | 'year';
export type Skill = { id: string; name: string; level: number; color: string; icon: string | null };
export type AgendaEvent = { id: string; title: string; weekday: number; start_time: string | null; end_time: string | null; color: string; event_date: string | null };
export type Dream = { id: string; title: string; solution: string | null; color: string };
export type DreamStep = { id: string; dream_id: string; title: string; done: boolean };
export type TaskPriority = 'low' | 'medium' | 'high';
export type Task = { id: string; title: string; priority: TaskPriority; done: boolean; is_recurring: boolean; recurrence: 'weekly' | 'monthly' | null };

export const formatMoney = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(amount);
export const formatDate = (date: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(`${date}T12:00:00`));
export const formatDateFull = (date: string) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
export const today = () => new Date().toISOString().slice(0, 10);
export const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
export const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DEFAULT_FIRST_NAME = 'Marie';
export const PALETTE = ['#F59E0B', '#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#84CC16'];
