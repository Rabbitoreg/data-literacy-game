-- Create tables for Data Literacy Game
-- Run this in your Supabase SQL Editor

-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  facilitator_name TEXT NOT NULL,
  max_teams INTEGER DEFAULT 10,
  status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  current_statement_index INTEGER DEFAULT 0,
  data_source TEXT DEFAULT 'sample' CHECK (data_source IN ('sample', 'csv')),
  csv_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (simplified for direct team access)
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_number INTEGER UNIQUE NOT NULL,
  budget INTEGER DEFAULT 1000,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  delivery_type TEXT CHECK (delivery_type IN ('instant', 'timed', 'observable_cell')),
  lead_time_minutes INTEGER DEFAULT 0,
  content TEXT,
  observable_config JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES items(id),
  statement_id TEXT REFERENCES statements(id),
  cost INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Decisions table
CREATE TABLE decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  statement_id TEXT REFERENCES statements(id),
  choice TEXT CHECK (choice IN ('true', 'false', 'unknown')),
  rationale TEXT DEFAULT '',
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  decider_name TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rounds table
CREATE TABLE rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  statement_id TEXT REFERENCES statements(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'recalled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Telemetry table (optional - for analytics)
CREATE TABLE telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample statements
INSERT INTO statements (id, text, topic, difficulty, ambiguity, truth_label, reason_key, recommended_items) VALUES
('S-001', 'Sales enablement training increased average deal size by 8% in Q3', 'Impact', 2, 3, false, 'Seasonality confound - Q3 typically shows higher deal sizes', ARRAY['I303', 'I509']),
('S-002', 'Pilot regions had significantly higher close rates than control regions', 'Effectiveness', 3, 2, true, 'Statistical significance confirmed (p<0.05) with proper controls', ARRAY['I501', 'I302']),
('S-003', 'Time-to-first-contact improved by 15% after training implementation', 'Process', 2, 4, null, 'Data quality issues make this determination impossible', ARRAY['I304', 'I506']),
('S-004', 'Customer satisfaction scores increased in all pilot regions', 'Outcome', 1, 2, true, 'Consistent improvement across all measured regions', ARRAY['I301', 'I507']),
('S-005', 'The training program ROI exceeded 300% in the first quarter', 'Financial', 4, 4, false, 'Calculation methodology flawed - missing opportunity costs', ARRAY['I305', 'I508']);

-- Insert sample store items
INSERT INTO items (id, name, description, cost, delivery_type, lead_time_minutes, content) VALUES
('I301', 'Customer Survey Results', 'Detailed satisfaction scores and feedback from pilot customers', 150, 'timed', 2, 'Survey data shows 87% satisfaction improvement with specific quotes and metrics'),
('I302', 'Statistical Analysis Report', 'Comprehensive statistical analysis with confidence intervals', 200, 'timed', 3, 'P-values, effect sizes, and confidence intervals for all key metrics'),
('I303', 'Historical Seasonality Data', 'Three years of Q3 performance data for comparison', 180, 'timed', 2, 'Q3 typically shows 12% higher deal sizes due to budget cycles'),
('I304', 'Data Quality Assessment', 'Technical report on data collection and validation issues', 120, 'instant', 0, 'Multiple data integrity issues identified in CRM timestamp logging'),
('I305', 'ROI Calculation Methodology', 'Detailed breakdown of ROI calculation assumptions', 160, 'timed', 1, 'Reveals missing opportunity cost calculations and attribution issues'),
('I501', 'Regional Performance Dashboard', 'Interactive visualization of pilot vs control performance', 160, 'observable_cell', 2, NULL),
('I506', 'Process Timeline Visualization', 'Chart showing contact timing patterns before/after training', 140, 'observable_cell', 2, NULL),
('I507', 'Customer Satisfaction Trends', 'Time series chart of satisfaction scores by region', 130, 'observable_cell', 1, NULL),
('I508', 'Financial Impact Analysis', 'Interactive ROI and cost-benefit visualization', 180, 'observable_cell', 3, NULL),
('I509', 'Deal Size Distribution Chart', 'Histogram and trend analysis of deal sizes over time', 150, 'observable_cell', 2, NULL);

-- Update observable items with configuration
UPDATE items SET observable_config = '{
  "notebook_id": "d/fb670ca5f330a7e9",
  "cells": ["chart_performance"],
  "mode": "iframe",
  "height": 400
}' WHERE id = 'I501';

UPDATE items SET observable_config = '{
  "notebook_id": "d/fb670ca5f330a7e9", 
  "cells": ["chart_timeline"],
  "mode": "iframe",
  "height": 300
}' WHERE id = 'I506';

UPDATE items SET observable_config = '{
  "notebook_id": "d/fb670ca5f330a7e9",
  "cells": ["chart_satisfaction"], 
  "mode": "iframe",
  "height": 350
}' WHERE id = 'I507';

UPDATE items SET observable_config = '{
  "notebook_id": "d/fb670ca5f330a7e9",
  "cells": ["chart_roi"],
  "mode": "iframe", 
  "height": 450
}' WHERE id = 'I508';

UPDATE items SET observable_config = '{
  "notebook_id": "d/fb670ca5f330a7e9",
  "cells": ["chart_deals"],
  "mode": "iframe",
  "height": 400  
}' WHERE id = 'I509';

-- Enable Row Level Security (optional but recommended)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize as needed)
CREATE POLICY "Allow all operations" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON purchases FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON decisions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON rounds FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON telemetry FOR ALL USING (true);
