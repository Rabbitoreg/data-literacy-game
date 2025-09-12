-- Create a database function to reset all game data and create new teams
CREATE OR REPLACE FUNCTION reset_game_data(p_max_teams INTEGER)
RETURNS JSON AS $$
DECLARE
    deleted_decisions INTEGER := 0;
    deleted_purchases INTEGER := 0;
    deleted_hint_purchases INTEGER := 0;
    deleted_teams INTEGER := 0;
    created_teams INTEGER := 0;
    i INTEGER;
    result JSON;
BEGIN
    -- Validate input
    IF p_max_teams < 1 OR p_max_teams > 20 THEN
        RAISE EXCEPTION 'Invalid number of teams. Must be between 1 and 20.';
    END IF;
    
    -- Clear all transactional data
    DELETE FROM decisions WHERE id IS NOT NULL;
    GET DIAGNOSTICS deleted_decisions = ROW_COUNT;
    
    DELETE FROM purchases WHERE id IS NOT NULL;
    GET DIAGNOSTICS deleted_purchases = ROW_COUNT;
    
    DELETE FROM hint_purchases WHERE id IS NOT NULL;
    GET DIAGNOSTICS deleted_hint_purchases = ROW_COUNT;
    
    -- Delete all existing teams
    DELETE FROM teams WHERE id IS NOT NULL;
    GET DIAGNOSTICS deleted_teams = ROW_COUNT;
    
    -- Create new teams
    FOR i IN 1..p_max_teams LOOP
        INSERT INTO teams (team_number, members, deciderorder, budget, score)
        VALUES (i, '{}', '{}', 1000, 0);
        created_teams := created_teams + 1;
    END LOOP;
    
    -- Update game configuration
    INSERT INTO game_config (key, value) 
    VALUES ('max_teams', p_max_teams::text)
    ON CONFLICT (key) 
    DO UPDATE SET value = p_max_teams::text;
    
    INSERT INTO game_config (key, value) 
    VALUES ('game_active', 'true')
    ON CONFLICT (key) 
    DO UPDATE SET value = 'true';
    
    -- Return summary
    result := json_build_object(
        'success', true,
        'deleted_decisions', deleted_decisions,
        'deleted_purchases', deleted_purchases,
        'deleted_hint_purchases', deleted_hint_purchases,
        'deleted_teams', deleted_teams,
        'created_teams', created_teams,
        'max_teams', p_max_teams
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error information
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_game_data(INTEGER) TO authenticated;
