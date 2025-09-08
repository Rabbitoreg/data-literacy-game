-- Simplified Data Literacy Game Schema
-- Simple schema for team-based game without sessions
-- Run this in your Supabase SQL Editor

-- Teams table (simplified)
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_number INTEGER UNIQUE NOT NULL,
  budget INTEGER DEFAULT 1000,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statements table
CREATE TABLE IF NOT EXISTS statements (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  ambiguity INTEGER CHECK (ambiguity BETWEEN 1 AND 5),
  truth_label BOOLEAN,
  reason_key TEXT NOT NULL,
  recommended_items TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table (store items)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL,
  delivery_type TEXT DEFAULT 'instant' CHECK (delivery_type IN ('instant', 'timed')),
  lead_time_minutes INTEGER DEFAULT 0,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  statement_id TEXT REFERENCES statements(id),
  choice TEXT NOT NULL CHECK (choice IN ('true', 'false', 'unknown')),
  rationale TEXT NOT NULL,
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table
CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample statements (keep existing)
INSERT INTO statements (id, text, correct_answer, points_true, points_false, points_unknown) VALUES
('stmt_1', 'The pilot program increased sales by more than 15% in the first quarter.', 'true', 100, -80, 70),
('stmt_2', 'Customer satisfaction scores improved significantly during the pilot.', 'unknown', -80, -80, 70),
('stmt_3', 'The pilot program was cost-effective compared to traditional marketing.', 'false', -80, 100, 70);

-- Sample items (keep existing)
INSERT INTO items (id, name, description, cost, lead_time_minutes, category) VALUES
('item_1', 'Detailed Sales Report', 'Comprehensive breakdown of sales data by region and product', 100, 2, 'data'),
('item_2', 'Customer Survey Results', 'Full customer satisfaction survey responses and analysis', 150, 3, 'feedback'),
('item_3', 'Cost Analysis', 'Detailed cost breakdown and ROI calculations', 200, 4, 'financial');
