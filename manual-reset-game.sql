-- Manual SQL commands to reset game data
-- Run these commands in sequence in your Supabase SQL editor

-- 1. Clear all transactional data
DELETE FROM decisions WHERE id IS NOT NULL;
DELETE FROM purchases WHERE id IS NOT NULL;
DELETE FROM hint_purchases WHERE id IS NOT NULL;

-- 2. Delete all teams
DELETE FROM teams WHERE id IS NOT NULL;

-- 3. Create 2 new teams (change the number as needed)
INSERT INTO teams (team_number, members, deciderorder, budget, score) VALUES 
(1, '{}', '{}', 1000, 0),
(2, '{}', '{}', 1000, 0);

-- 4. Update game configuration
INSERT INTO game_config (key, value) VALUES ('max_teams', '2') 
ON CONFLICT (key) DO UPDATE SET value = '2';

INSERT INTO game_config (key, value) VALUES ('game_active', 'true') 
ON CONFLICT (key) DO UPDATE SET value = 'true';

-- 5. Verify the results
SELECT COUNT(*) as team_count FROM teams;
SELECT * FROM game_config WHERE key = 'max_teams';
