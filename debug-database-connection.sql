-- Debug script to check database connection and schema
-- Run this in your Supabase SQL editor to verify what the API sees

-- 1. Check current database and schema
SELECT current_database(), current_schema();

-- 2. Check all teams in public schema
SELECT COUNT(*) as total_teams, 
       array_agg(team_number ORDER BY team_number) as team_numbers
FROM public.teams;

-- 3. Check if there are teams in other schemas
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables 
WHERE tablename = 'teams';

-- 4. Check for any database triggers or policies on teams table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'teams';

-- 5. Check RLS policies on teams table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'teams';

-- 6. Manual cleanup - delete all teams directly
DELETE FROM public.teams WHERE team_number >= 1;

-- 7. Create exactly 1 team
INSERT INTO public.teams (team_number, members, deciderorder, budget, score)
VALUES (1, '{}', '{}', 1000, 0);

-- 8. Verify final state
SELECT COUNT(*) as final_count FROM public.teams;
