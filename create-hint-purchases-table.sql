-- Create hint_purchases table to track purchased hints
CREATE TABLE IF NOT EXISTS hint_purchases (
  id SERIAL PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  statement_id TEXT NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
  cost INTEGER NOT NULL DEFAULT 10,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, statement_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hint_purchases_team_statement ON hint_purchases(team_id, statement_id);

-- Add RLS policy if needed
ALTER TABLE hint_purchases ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted later)
DROP POLICY IF EXISTS "Allow all operations on hint_purchases" ON hint_purchases;
CREATE POLICY "Allow all operations on hint_purchases" ON hint_purchases
  FOR ALL USING (true);
