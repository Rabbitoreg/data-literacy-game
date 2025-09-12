-- Check current config and teams after start new game attempt
SELECT * FROM game_config WHERE key = 'max_teams';
SELECT COUNT(*) as actual_teams FROM teams;
SELECT team_number FROM teams ORDER BY team_number;
