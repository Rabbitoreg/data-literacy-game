-- Create game configuration table
CREATE TABLE IF NOT EXISTS game_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO game_config (key, value, description) VALUES 
  ('max_teams', '8', 'Maximum number of teams allowed in the game'),
  ('initial_budget', '1000', 'Starting budget for each team'),
  ('game_active', 'true', 'Whether the game is currently active')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for game_config table
DROP TRIGGER IF EXISTS update_game_config_updated_at ON game_config;
CREATE TRIGGER update_game_config_updated_at
    BEFORE UPDATE ON game_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
