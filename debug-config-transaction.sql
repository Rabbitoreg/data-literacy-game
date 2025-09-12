-- Check if there are multiple config records or transaction issues
SELECT * FROM game_config ORDER BY key;

-- Check if there's a transaction in progress
SELECT * FROM pg_stat_activity WHERE state != 'idle';

-- Force commit any pending transactions
COMMIT;

-- Try the update again with explicit transaction
BEGIN;
UPDATE game_config SET value = '3' WHERE key = 'max_teams';
COMMIT;

-- Verify the update
SELECT key, value FROM game_config WHERE key = 'max_teams';
