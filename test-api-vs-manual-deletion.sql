-- Test to compare API vs manual deletion behavior

-- 1. First, create some test teams manually
INSERT INTO teams (team_number, members, deciderorder, budget, score) VALUES 
(1, '{}', '{}', 1000, 0),
(2, '{}', '{}', 1000, 0);

-- 2. Verify teams were created
SELECT COUNT(*) as teams_after_manual_insert FROM teams;

-- 3. Now run the API "Start New Game" and compare results
-- The API should delete these 2 teams but we'll see if they persist

-- 4. After API call, check if teams still exist
-- SELECT COUNT(*) as teams_after_api_call FROM teams;

-- 5. If API deletion fails, try manual deletion again
-- DELETE FROM teams WHERE team_number >= 1;
-- SELECT COUNT(*) as teams_after_manual_delete FROM teams;
