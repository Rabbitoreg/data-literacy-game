-- Add prerequisite column to items table
-- This allows items to have prerequisites that must be purchased before they become available

ALTER TABLE items 
ADD COLUMN prerequisite_item_id TEXT REFERENCES items(id);

-- Update some sample items to demonstrate the prerequisite system
-- Make sure we have some items without prerequisites (available immediately)
UPDATE items SET prerequisite_item_id = NULL WHERE id IN ('basic_report', 'survey_data', 'competitor_analysis');

-- Set up some prerequisite chains
-- Advanced reports require basic report
UPDATE items SET prerequisite_item_id = 'basic_report' WHERE id = 'advanced_analytics';
UPDATE items SET prerequisite_item_id = 'basic_report' WHERE id = 'predictive_model';

-- Premium features require survey data
UPDATE items SET prerequisite_item_id = 'survey_data' WHERE id = 'customer_segmentation';

-- Expert consultation requires competitor analysis
UPDATE items SET prerequisite_item_id = 'competitor_analysis' WHERE id = 'expert_consultation';

-- Create a comment for documentation
COMMENT ON COLUMN items.prerequisite_item_id IS 'ID of item that must be purchased before this item becomes available. NULL means no prerequisite.';
