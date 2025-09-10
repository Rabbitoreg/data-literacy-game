-- Fix statement ID foreign key constraint violations
-- Run this in Supabase SQL Editor to safely update statement IDs

-- Step 1: Delete all dependent records first (to avoid foreign key violations)
DELETE FROM statement_scoring WHERE statement_id IN ('S-001', 'S-002', 'S-003', 'S-004', 'S-005');
DELETE FROM statement_evaluations WHERE statement_id IN ('S-001', 'S-002', 'S-003', 'S-004', 'S-005');
DELETE FROM purchases WHERE statement_id IN ('S-001', 'S-002', 'S-003', 'S-004', 'S-005');
DELETE FROM decisions WHERE statement_id IN ('S-001', 'S-002', 'S-003', 'S-004', 'S-005');
DELETE FROM rounds WHERE statement_id IN ('S-001', 'S-002', 'S-003', 'S-004', 'S-005');

-- Step 2: Update statement IDs
UPDATE statements SET id = 'stmt_1' WHERE id = 'S-001';
UPDATE statements SET id = 'stmt_2' WHERE id = 'S-002';
UPDATE statements SET id = 'stmt_3' WHERE id = 'S-003';
UPDATE statements SET id = 'stmt_4' WHERE id = 'S-004';
UPDATE statements SET id = 'stmt_5' WHERE id = 'S-005';

-- Step 3: Verify the changes
SELECT id, text FROM statements ORDER BY id;
