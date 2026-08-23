/*
# Major update: notes, skills, agenda, dreams, tasks

1. Modified Tables
- `budget_expenses`: added `note` (text, nullable) — optional description on any entry.

2. New Tables
- `skills`: RPG-style skill tracking (e.g. DJ, Anglais, Sport).
  - `id` (uuid PK), `name` (text), `level` (int 1-100, default 1), `color` (text), `icon` (text, nullable), `created_at`.
- `agenda_events`: weekly agenda events.
  - `id` (uuid PK), `title` (text), `weekday` (int 0-6, Monday=0), `start_time` (text, e.g. "14:00"), `end_time` (text, nullable), `color` (text), `created_at`.
- `dreams`: "Je voudrais" goals with solution/steps.
  - `id` (uuid PK), `title` (text), `solution` (text, nullable), `color` (text), `created_at`.
- `tasks`: smart to-do list with priority.
  - `id` (uuid PK), `title` (text), `priority` (text: 'low'|'medium'|'high', default 'medium'), `done` (boolean, default false), `created_at`.

3. Security
- RLS enabled on all new tables with anon+authenticated full CRUD (single-tenant, no auth).
*/

DO $$ BEGIN
  ALTER TABLE budget_expenses ADD COLUMN note text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level int NOT NULL DEFAULT 1 CHECK (level >= 0 AND level <= 100),
  color text NOT NULL DEFAULT '#F59E0B',
  icon text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_skills" ON skills;
CREATE POLICY "anon_select_skills" ON skills FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_skills" ON skills;
CREATE POLICY "anon_insert_skills" ON skills FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_skills" ON skills;
CREATE POLICY "anon_update_skills" ON skills FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_skills" ON skills;
CREATE POLICY "anon_delete_skills" ON skills FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS agenda_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  weekday int NOT NULL DEFAULT 0 CHECK (weekday >= 0 AND weekday <= 6),
  start_time text,
  end_time text,
  color text NOT NULL DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_agenda" ON agenda_events;
CREATE POLICY "anon_select_agenda" ON agenda_events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_agenda" ON agenda_events;
CREATE POLICY "anon_insert_agenda" ON agenda_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_agenda" ON agenda_events;
CREATE POLICY "anon_update_agenda" ON agenda_events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_agenda" ON agenda_events;
CREATE POLICY "anon_delete_agenda" ON agenda_events FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS dreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  solution text,
  color text NOT NULL DEFAULT '#F59E0B',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_dreams" ON dreams;
CREATE POLICY "anon_select_dreams" ON dreams FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dreams" ON dreams;
CREATE POLICY "anon_insert_dreams" ON dreams FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dreams" ON dreams;
CREATE POLICY "anon_update_dreams" ON dreams FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dreams" ON dreams;
CREATE POLICY "anon_delete_dreams" ON dreams FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);