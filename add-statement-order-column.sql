-- Add statement_order column to statements table
ALTER TABLE statements ADD COLUMN statement_order INTEGER;

-- Set default values using row number for ordering (since IDs are text like 'stmt_2')
WITH ordered_statements AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num
  FROM statements
)
UPDATE statements 
SET statement_order = ordered_statements.row_num
FROM ordered_statements
WHERE statements.id = ordered_statements.id AND statements.statement_order IS NULL;

-- Verify the column was added
SELECT id, text, statement_order FROM statements ORDER BY statement_order;
