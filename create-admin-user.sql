-- Create admin user for authentication
-- Run this in Supabase SQL Editor

-- First, enable email authentication if not already enabled
-- This should be done in Supabase Dashboard > Authentication > Settings

-- Create an admin user (replace with your desired email/password)
-- Note: This creates a user directly in the auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Alternative: Use Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Email: admin@example.com
-- Password: admin123
-- Auto Confirm User: Yes
