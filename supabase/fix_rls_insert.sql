-- Additional RLS Fixes for House Creation
-- Run this in Supabase SQL Editor

-- Allow authenticated users to create houses
DROP POLICY IF EXISTS "Users can create houses" ON houses;
CREATE POLICY "Users can create houses" ON houses FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert rooms when creating a house
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms" ON rooms FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to add themselves as first member
DROP POLICY IF EXISTS "Users can add themselves" ON house_members;
CREATE POLICY "Users can add themselves" ON house_members FOR INSERT 
  WITH CHECK (user_id = auth.uid());
