-- Manually update the config to test if the issue is with the API or database
UPDATE game_config SET value = '3' WHERE key = 'max_teams';

-- Verify the update
SELECT * FROM game_config WHERE key = 'max_teams';
