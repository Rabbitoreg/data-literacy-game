-- Add only the missing INSERT policy for statements table
-- Run this in Supabase SQL Editor

-- Add INSERT policy for statements (if it doesn't exist)
CREATE POLICY "Public insert statements" ON statements FOR INSERT WITH CHECK (true);

-- Grant INSERT permission to anonymous users
GRANT INSERT ON statements TO anon;
