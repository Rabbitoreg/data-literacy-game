-- Add prerequisite_statement column to items table
-- This allows items to have statement prerequisites that must be answered before they become available
-- Works in conjunction with existing prerequisite_item_id for AND logic

ALTER TABLE items 
ADD COLUMN prerequisite_statement_id TEXT REFERENCES statements(id);

-- Add comment for documentation
COMMENT ON COLUMN items.prerequisite_statement_id IS 'ID of statement that must be answered by the team before this item becomes available. NULL means no statement prerequisite. Works with prerequisite_item_id using AND logic.';

-- Example: Make some items available only after answering specific statements
-- UPDATE items SET prerequisite_statement_id = 'statement_1' WHERE id = 'advanced_analytics';
-- UPDATE items SET prerequisite_statement_id = 'statement_2' WHERE id = 'expert_consultation';
