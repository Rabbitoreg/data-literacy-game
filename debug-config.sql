-- Debug current game configuration
-- Check current config values
SELECT * FROM game_config ORDER BY key;

-- Check teams count
SELECT COUNT(*) as team_count FROM teams;

-- Check if config was updated after start new game
SELECT key, value, created_at, updated_at FROM game_config WHERE key = 'max_teams';

-- Check current teams in database
SELECT team_number, id FROM teams ORDER BY team_number;
