-- Check for database triggers that might be recreating teams
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'teams'
ORDER BY trigger_name;

-- Check for any functions that might be creating teams
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%teams%' 
AND routine_type = 'FUNCTION';

-- Check for any policies on teams table
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'teams';

-- Check if RLS is enabled on teams table
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'teams';

-- Look for any scheduled jobs or background processes
SELECT * FROM pg_stat_activity WHERE query ILIKE '%teams%';
