/*
# Extend budget_expenses with entry type and recurring flag

1. Modified Tables
- `budget_expenses.entry_type` distinguishes spending ('expense') from income ('income'). Defaults to 'expense'.
- `budget_expenses.is_recurring` marks a recurring monthly entry (rent, subscriptions). Defaults to false.

2. Notes
- Columns are added idempotently with DO blocks so re-running is safe.
- No data loss: existing rows default to 'expense' and non-recurring.
*/

DO $$ BEGIN
  ALTER TABLE budget_expenses ADD COLUMN entry_type text NOT NULL DEFAULT 'expense' CHECK (entry_type IN ('expense', 'income'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE budget_expenses ADD COLUMN is_recurring boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS budget_expenses_type_idx ON budget_expenses(entry_type);