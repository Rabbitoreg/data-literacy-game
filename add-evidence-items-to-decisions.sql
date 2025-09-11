-- Add evidence_items column to decisions table to store selected purchase items
-- This allows tracking which evidence items were used when making a decision

ALTER TABLE decisions ADD COLUMN evidence_items TEXT[] DEFAULT '{}';

-- Add comment to document the column purpose
COMMENT ON COLUMN decisions.evidence_items IS 'Array of item IDs that were selected as evidence when making this decision';
