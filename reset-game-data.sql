-- Reset Game Data Script
-- This script clears all team data to start a fresh game for testing

-- Clear hint purchases
DELETE FROM hint_purchases;

-- Clear team purchases
DELETE FROM purchases;

-- Clear team decisions
DELETE FROM decisions;

-- Reset team data (keep teams but reset scores, budgets, and members)
UPDATE teams SET 
  score = 0,
  budget = 1000,
  members = '{}'::text[];

-- Optional: Completely remove all teams (uncomment if you want to delete teams entirely)
-- DELETE FROM teams;

-- Display summary
SELECT 'Game data reset completed' as status;
SELECT COUNT(*) as remaining_teams FROM teams;
SELECT COUNT(*) as remaining_decisions FROM decisions;
SELECT COUNT(*) as remaining_purchases FROM purchases;
SELECT COUNT(*) as remaining_hints FROM hint_purchases;
