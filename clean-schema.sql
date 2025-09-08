-- Clean schema setup for existing database
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS statements CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Teams table (simplified)
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_number INTEGER UNIQUE NOT NULL,
  budget INTEGER DEFAULT 1000,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table (store items)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL,
  content TEXT NOT NULL,
  observablehq_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Statements table
CREATE TABLE statements (
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
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL,
  delivery_type TEXT DEFAULT 'instant' CHECK (delivery_type IN ('instant', 'timed')),
  lead_time_minutes INTEGER DEFAULT 0,
  content TEXT,
  observablehq_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decisions table
CREATE TABLE decisions (
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES items(id),
  statement_id TEXT REFERENCES statements(id),
  cost INTEGER NOT NULL,
  status TEXT DEFAULT 'delivered' CHECK (status IN ('pending', 'delivered')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO statements (id, text, topic, difficulty, ambiguity, truth_label, reason_key, recommended_items) VALUES
('stmt_1', 'The pilot program increased sales by more than 15% in all regions.', 'Sales Performance', 3, 4, false, 'Regional variation exists', ARRAY['regional_breakdown', 'performance_metrics']),
('stmt_2', 'Training completion rates were consistently above 80% across all participant groups.', 'Training Effectiveness', 2, 3, true, 'High engagement recorded', ARRAY['training_data', 'completion_rates']),
('stmt_3', 'Customer satisfaction scores improved by at least 10% in the pilot regions.', 'Customer Experience', 3, 3, true, 'Positive feedback trends', ARRAY['satisfaction_survey', 'customer_feedback']);

INSERT INTO items (id, name, description, cost, delivery_type, lead_time_minutes, content, observablehq_url) VALUES
('item-1', 'Training Completion Data', 'Complete training metrics and participant feedback', 100, 'instant', 0, 'Detailed training completion rates by department: Sales 85%, Marketing 92%, Operations 78%. Participant feedback shows high satisfaction with interactive modules but requests for more practical exercises.', 'https://observablehq.com/@d3/bar-chart'),
('item-2', 'Training Completion Rates', 'Detailed completion statistics by department', 120, 'timed', 2, 'Training completion breakdown: Q1: 82%, Q2: 89%, Q3: 91%, Q4: 87%. Top performing departments consistently show higher engagement with mobile learning platforms.', 'https://observablehq.com/@d3/line-chart'),
('item-3', 'Regional Performance Breakdown', 'Detailed sales data by region and time period', 150, 'timed', 3, 'Regional performance analysis: North 15% above target, South 8% below target, East 12% above target, West 3% above target. Seasonal trends show Q4 peak performance across all regions.', 'https://observablehq.com/@d3/choropleth'),
('item-4', 'Customer Satisfaction Survey', 'Complete customer feedback and satisfaction metrics', 200, 'instant', 0, 'Customer satisfaction survey results: Overall satisfaction 4.2/5, Product quality 4.5/5, Customer service 3.9/5, Value for money 4.1/5. Key improvement areas identified in service response time.', NULL);
