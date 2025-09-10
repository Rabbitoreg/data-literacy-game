-- Admin Authentication Security Policies
-- Run this in Supabase SQL Editor

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public read statements" ON statements;
DROP POLICY IF EXISTS "Public update statements" ON statements;
DROP POLICY IF EXISTS "Public insert statements" ON statements;

-- Create admin-only policies for statements
CREATE POLICY "Authenticated users can read statements" ON statements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update statements" ON statements FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert statements" ON statements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions to authenticated users only
REVOKE ALL ON statements FROM anon;
GRANT SELECT, UPDATE, INSERT ON statements TO authenticated;
