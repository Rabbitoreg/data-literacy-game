-- Find what's recreating teams after deletion

-- 1. Check for database triggers on teams table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'teams';

-- 2. Check for functions that insert teams
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%INSERT INTO teams%' 
   OR routine_definition ILIKE '%insert into teams%';

-- 3. Check for any scheduled jobs or cron jobs (skip if cron extension not installed)
-- SELECT * FROM cron.job WHERE command ILIKE '%teams%';

-- 4. Check for any policies that might be causing issues
SELECT * FROM pg_policies WHERE tablename = 'teams';

-- 5. Look for any active connections running team-related queries
SELECT pid, query, state, query_start 
FROM pg_stat_activity 
WHERE query ILIKE '%teams%' 
  AND state = 'active';

-- 6. Check if there are any views or materialized views involving teams
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE view_definition ILIKE '%teams%';

-- 7. Disable any potential auto-recreation by checking current team count
SELECT COUNT(*) as current_team_count FROM teams;

-- 8. Test deletion manually to see immediate effect
DELETE FROM teams WHERE team_number >= 1;

-- 9. Check count immediately after deletion
SELECT COUNT(*) as count_after_manual_delete FROM teams;

-- 10. Wait and check again (simulate delay)
SELECT pg_sleep(2);
SELECT COUNT(*) as count_after_delay FROM teams;
