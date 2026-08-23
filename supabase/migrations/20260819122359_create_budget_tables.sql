/*
# Create budget tables for a shared household budget

1. New Tables
- `budget_categories` stores each spending category with a user-selected name and color.
- `budget_categories.id` is the unique category identifier.
- `budget_categories.name` is the visible category label.
- `budget_categories.color` is the hex color used throughout the dashboard.
- `budget_categories.created_at` records when the category was created.
- `budget_expenses` stores each spending entry.
- `budget_expenses.id` is the unique expense identifier.
- `budget_expenses.amount` stores the positive amount spent.
- `budget_expenses.category_id` links an expense to a category and becomes empty if that category is removed.
- `budget_expenses.expense_date` stores the date used by month and year filters.
- `budget_expenses.created_at` records when the expense was created.

2. Security
- Row-level security is enabled on both tables.
- Because this app has no sign-in, anon and authenticated users can manage the intentionally shared budget data.
- Separate read, create, edit, and delete policies are created for each table.

3. Important Notes
- Default categories are inserted only when they do not already exist.
- Deleting a category keeps its expenses and leaves them uncategorized instead of deleting spending history.
*/

CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 40),
  color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budget_expenses_date_idx ON budget_expenses(expense_date);
CREATE INDEX IF NOT EXISTS budget_expenses_category_idx ON budget_expenses(category_id);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shared_select_budget_categories" ON budget_categories;
CREATE POLICY "shared_select_budget_categories" ON budget_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_budget_categories" ON budget_categories;
CREATE POLICY "shared_insert_budget_categories" ON budget_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_budget_categories" ON budget_categories;
CREATE POLICY "shared_update_budget_categories" ON budget_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_budget_categories" ON budget_categories;
CREATE POLICY "shared_delete_budget_categories" ON budget_categories FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shared_select_budget_expenses" ON budget_expenses;
CREATE POLICY "shared_select_budget_expenses" ON budget_expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "shared_insert_budget_expenses" ON budget_expenses;
CREATE POLICY "shared_insert_budget_expenses" ON budget_expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "shared_update_budget_expenses" ON budget_expenses;
CREATE POLICY "shared_update_budget_expenses" ON budget_expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "shared_delete_budget_expenses" ON budget_expenses;
CREATE POLICY "shared_delete_budget_expenses" ON budget_expenses FOR DELETE TO anon, authenticated USING (true);

INSERT INTO budget_categories (name, color)
SELECT seed.name, seed.color
FROM (VALUES
  ('Courses', '#F59E0B'),
  ('Électricité', '#3B82F6'),
  ('Sport', '#10B981'),
  ('Transport', '#F97316')
) AS seed(name, color)
WHERE NOT EXISTS (
  SELECT 1 FROM budget_categories existing WHERE lower(existing.name) = lower(seed.name)
);