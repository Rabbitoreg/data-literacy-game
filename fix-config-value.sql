-- Fix the config value that got set to literal ${maxTeams}
UPDATE game_config SET value = '5' WHERE key = 'max_teams' AND value = '${maxTeams}';

-- Verify the fix
SELECT * FROM game_config WHERE key = 'max_teams';
