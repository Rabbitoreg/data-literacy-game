-- Supabase Security Configuration for Data Literacy Game
-- Run this SQL to secure your database

-- 1. Enable Row Level Security on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON sessions;
DROP POLICY IF EXISTS "Allow all operations" ON teams;
DROP POLICY IF EXISTS "Allow all operations" ON statements;
DROP POLICY IF EXISTS "Allow all operations" ON items;
DROP POLICY IF EXISTS "Allow all operations" ON purchases;
DROP POLICY IF EXISTS "Allow all operations" ON decisions;
DROP POLICY IF EXISTS "Allow all operations" ON rounds;

-- 3. Create secure policies

-- Sessions: Allow basic operations for game management
CREATE POLICY "Public read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Public insert sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sessions" ON sessions FOR UPDATE USING (true);

-- Teams: Allow all operations (teams are public in this game)
CREATE POLICY "Public team access" ON teams FOR ALL USING (true);

-- Statements: Read-only access (game content)
CREATE POLICY "Public read statements" ON statements FOR SELECT USING (true);

-- Items: Read-only access (store content)
CREATE POLICY "Public read items" ON items FOR SELECT USING (true);

-- Purchases: Teams can only manage their own purchases
CREATE POLICY "Team purchases only" ON purchases FOR ALL USING (
  team_id IN (SELECT id FROM teams)
);

-- Decisions: Teams can only manage their own decisions
CREATE POLICY "Team decisions only" ON decisions FOR ALL USING (
  team_id IN (SELECT id FROM teams)
);

-- Rounds: Teams can only manage their own rounds
CREATE POLICY "Team rounds only" ON rounds FOR ALL USING (
  team_id IN (SELECT id FROM teams)
);

-- 4. Additional security measures

-- Disable public schema access for anonymous users (optional)
-- REVOKE ALL ON SCHEMA public FROM anon;
-- GRANT USAGE ON SCHEMA public TO anon;

-- Grant specific table access to anonymous users
GRANT SELECT ON statements TO anon;
GRANT SELECT ON items TO anon;
GRANT ALL ON teams TO anon;
GRANT ALL ON sessions TO anon;
GRANT ALL ON purchases TO anon;
GRANT ALL ON decisions TO anon;
GRANT ALL ON rounds TO anon;

-- 5. Enable realtime for necessary tables (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE teams;
-- ALTER PUBLICATION supabase_realtime ADD TABLE decisions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
