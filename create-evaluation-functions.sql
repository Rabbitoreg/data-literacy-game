-- Create PostgreSQL functions to bypass PostgREST cache issues
-- These functions work directly with the database

-- First create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS statement_scoring (
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

-- Enable RLS
ALTER TABLE statement_scoring ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then create it
DROP POLICY IF EXISTS "Allow all statement_scoring" ON statement_scoring;
CREATE POLICY "Allow all statement_scoring" ON statement_scoring FOR ALL USING (true);

-- Function to get evaluations for a statement
CREATE OR REPLACE FUNCTION get_statement_evaluations(p_statement_id TEXT)
RETURNS TABLE (
  id UUID,
  statement_id TEXT,
  choice TEXT,
  is_correct BOOLEAN,
  points INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.statement_id,
    s.choice,
    s.is_correct,
    s.points,
    s.feedback,
    s.created_at,
    s.updated_at
  FROM statement_scoring s
  WHERE s.statement_id = p_statement_id
  ORDER BY s.choice;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save/update evaluation
CREATE OR REPLACE FUNCTION save_statement_evaluation(
  p_statement_id TEXT,
  p_choice TEXT,
  p_is_correct BOOLEAN,
  p_points INTEGER,
  p_feedback TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  statement_id TEXT,
  choice TEXT,
  is_correct BOOLEAN,
  points INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO statement_scoring (statement_id, choice, is_correct, points, feedback, updated_at)
  VALUES (p_statement_id, p_choice, p_is_correct, p_points, p_feedback, NOW())
  ON CONFLICT (statement_id, choice)
  DO UPDATE SET
    is_correct = EXCLUDED.is_correct,
    points = EXCLUDED.points,
    feedback = EXCLUDED.feedback,
    updated_at = NOW()
  RETURNING 
    statement_scoring.id,
    statement_scoring.statement_id,
    statement_scoring.choice,
    statement_scoring.is_correct,
    statement_scoring.points,
    statement_scoring.feedback,
    statement_scoring.created_at,
    statement_scoring.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete evaluation
CREATE OR REPLACE FUNCTION delete_statement_evaluation(
  p_statement_id TEXT,
  p_choice TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM statement_scoring 
  WHERE statement_id = p_statement_id AND choice = p_choice;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test with sample data
INSERT INTO statement_scoring (statement_id, choice, is_correct, points, feedback) 
VALUES ('S-001', 'true', true, 50, 'Test evaluation')
ON CONFLICT (statement_id, choice) DO NOTHING;
