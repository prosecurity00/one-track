/*
# Extend entry_type to include savings

1. Modified Tables
- `budget_expenses.entry_type` now accepts 'savings' in addition to 'expense' and 'income'.
- Existing rows are unaffected; the column default stays 'expense'.

2. Notes
- The constraint is replaced (drop + recreate) to add the new allowed value.
- Idempotent: safe to re-run.
*/

ALTER TABLE budget_expenses DROP CONSTRAINT IF EXISTS budget_expenses_entry_type_check;
ALTER TABLE budget_expenses ADD CONSTRAINT budget_expenses_entry_type_check CHECK (entry_type IN ('expense', 'income', 'savings'));