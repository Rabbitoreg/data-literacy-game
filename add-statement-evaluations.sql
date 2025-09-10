-- Add statement_evaluations table for flexible scoring system
CREATE TABLE statement_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id TEXT NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
  choice TEXT NOT NULL CHECK (choice IN ('true', 'false', 'unknown')),
  is_correct BOOLEAN NOT NULL,
  points INTEGER NOT NULL,
  feedback TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(statement_id, choice)
);

-- Enable Row Level Security
ALTER TABLE statement_evaluations ENABLE ROW LEVEL SECURITY;

-- Allow read access to statement evaluations
CREATE POLICY "Allow read statement_evaluations" ON statement_evaluations FOR SELECT USING (true);

-- Allow admin operations on statement evaluations
CREATE POLICY "Allow admin statement_evaluations" ON statement_evaluations FOR ALL USING (true);

-- Add feedback column to decisions table if it doesn't exist
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS feedback TEXT DEFAULT '';
