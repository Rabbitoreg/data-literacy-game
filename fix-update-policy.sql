-- Fix the UPDATE policy for statements table
-- The current policy might be too restrictive

-- Drop and recreate the update policy with proper permissions
DROP POLICY IF EXISTS "Public update statements" ON statements;
CREATE POLICY "Public update statements" ON statements FOR UPDATE USING (true) WITH CHECK (true);

-- Ensure UPDATE permission is granted
GRANT UPDATE ON statements TO anon;
