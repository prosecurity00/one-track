/*
# Savings goals (tirelires) system

1. New Tables
- `savings_goals`: represents a savings goal (tirelire) like "Voiture", "Permis".
  - `id` (uuid PK)
  - `name` (text, not null) — e.g. "Voiture"
  - `target_amount` (numeric, default 0) — objective to reach
  - `color` (text, default '#F59E0B') — accent color for the card
  - `created_at` (timestamptz)

2. Modified Tables
- `budget_expenses`: added `savings_goal_id` (uuid, nullable, FK to savings_goals)
  so each savings entry can be linked to a specific tirelire.

3. Security
- RLS enabled on `savings_goals` with anon+authenticated full CRUD (single-tenant, no auth).
- The new column on budget_expenses inherits the existing policies.
*/

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric(12,2) NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#F59E0B',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_savings_goals" ON savings_goals;
CREATE POLICY "anon_select_savings_goals" ON savings_goals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_savings_goals" ON savings_goals;
CREATE POLICY "anon_insert_savings_goals" ON savings_goals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_savings_goals" ON savings_goals;
CREATE POLICY "anon_update_savings_goals" ON savings_goals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_savings_goals" ON savings_goals;
CREATE POLICY "anon_delete_savings_goals" ON savings_goals FOR DELETE
  TO anon, authenticated USING (true);

DO $$ BEGIN
  ALTER TABLE budget_expenses ADD COLUMN savings_goal_id uuid REFERENCES savings_goals(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;