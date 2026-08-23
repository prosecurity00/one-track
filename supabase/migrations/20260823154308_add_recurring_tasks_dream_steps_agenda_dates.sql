/*
# Add recurring tasks, dream steps, and agenda event dates

1. Modified Tables
- `tasks`: added `is_recurring` (boolean, default false) and `recurrence` (text: 'weekly'|'monthly', nullable) — optional recurring task flag.
- `agenda_events`: added `event_date` (date, nullable) — allows events to be tied to a specific date instead of just a weekday, enabling monthly calendar navigation.

2. New Tables
- `dream_steps`: sub-steps for each dream/goal, with a done checkbox.
  - `id` (uuid PK), `dream_id` (uuid FK → dreams ON DELETE CASCADE), `title` (text), `done` (boolean, default false), `created_at`.

3. Security
- RLS enabled on dream_steps with anon+authenticated full CRUD (single-tenant, no auth).
*/

DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN is_recurring boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN recurrence text CHECK (recurrence IN ('weekly','monthly'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE agenda_events ADD COLUMN event_date date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS dream_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dream_id uuid NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE dream_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_dream_steps" ON dream_steps;
CREATE POLICY "anon_select_dream_steps" ON dream_steps FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dream_steps" ON dream_steps;
CREATE POLICY "anon_insert_dream_steps" ON dream_steps FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dream_steps" ON dream_steps;
CREATE POLICY "anon_update_dream_steps" ON dream_steps FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dream_steps" ON dream_steps;
CREATE POLICY "anon_delete_dream_steps" ON dream_steps FOR DELETE TO anon, authenticated USING (true);