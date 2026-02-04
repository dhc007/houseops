-- Fix RLS Infinite Recursion Issue
-- Run this in Supabase SQL Editor to fix the house_members policy

-- First, drop the problematic policies
DROP POLICY IF EXISTS "View house members" ON house_members;
DROP POLICY IF EXISTS "Admins can manage members" ON house_members;
DROP POLICY IF EXISTS "House members can view house" ON houses;
DROP POLICY IF EXISTS "House admins can update" ON houses;
DROP POLICY IF EXISTS "View visitors" ON visitors;
DROP POLICY IF EXISTS "Members can add visitors" ON visitors;
DROP POLICY IF EXISTS "View expenses" ON expenses;
DROP POLICY IF EXISTS "Create expenses" ON expenses;
DROP POLICY IF EXISTS "View expense splits" ON expense_splits;
DROP POLICY IF EXISTS "View inventory" ON inventory_items;
DROP POLICY IF EXISTS "Manage inventory" ON inventory_items;
DROP POLICY IF EXISTS "View tasks" ON tasks;
DROP POLICY IF EXISTS "Manage tasks" ON tasks;
DROP POLICY IF EXISTS "View rooms" ON rooms;
DROP POLICY IF EXISTS "Admins manage rooms" ON rooms;

-- Create a security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION get_user_house_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT house_id FROM house_members WHERE user_id = user_uuid AND is_active = true;
$$;

-- Create a function to check if user is admin of a house
CREATE OR REPLACE FUNCTION is_house_admin(user_uuid UUID, house_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM house_members 
    WHERE user_id = user_uuid AND house_id = house_uuid AND role = 'admin' AND is_active = true
  );
$$;

-- Now recreate policies using the security definer functions

-- House Members policies
CREATE POLICY "View house members" ON house_members FOR SELECT 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Insert house members" ON house_members FOR INSERT 
  WITH CHECK (
    -- User can add themselves when joining a house
    user_id = auth.uid() OR 
    -- Or admin can add others
    is_house_admin(auth.uid(), house_id)
  );

CREATE POLICY "Update house members" ON house_members FOR UPDATE 
  USING (is_house_admin(auth.uid(), house_id));

CREATE POLICY "Delete house members" ON house_members FOR DELETE 
  USING (is_house_admin(auth.uid(), house_id));

-- Houses policies
CREATE POLICY "House members can view house" ON houses FOR SELECT 
  USING (id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "House admins can update" ON houses FOR UPDATE 
  USING (is_house_admin(auth.uid(), id));

-- Visitors policies
CREATE POLICY "View visitors" ON visitors FOR SELECT 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Members can add visitors" ON visitors FOR INSERT 
  WITH CHECK (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Members can update visitors" ON visitors FOR UPDATE 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Members can delete visitors" ON visitors FOR DELETE 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

-- Expenses policies
CREATE POLICY "View expenses" ON expenses FOR SELECT 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Create expenses" ON expenses FOR INSERT 
  WITH CHECK (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Update expenses" ON expenses FOR UPDATE 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

-- Expense Splits policies
CREATE POLICY "View expense splits" ON expense_splits FOR SELECT 
  USING (expense_id IN (
    SELECT id FROM expenses WHERE house_id IN (SELECT get_user_house_ids(auth.uid()))
  ));

CREATE POLICY "Manage expense splits" ON expense_splits FOR ALL 
  USING (expense_id IN (
    SELECT id FROM expenses WHERE house_id IN (SELECT get_user_house_ids(auth.uid()))
  ));

-- Inventory policies
CREATE POLICY "View inventory" ON inventory_items FOR SELECT 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Manage inventory" ON inventory_items FOR ALL 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

-- Tasks policies
CREATE POLICY "View tasks" ON tasks FOR SELECT 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Manage tasks" ON tasks FOR ALL 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

-- Rooms policies
CREATE POLICY "View rooms" ON rooms FOR SELECT 
  USING (house_id IN (SELECT get_user_house_ids(auth.uid())));

CREATE POLICY "Admins manage rooms" ON rooms FOR ALL 
  USING (is_house_admin(auth.uid(), house_id));
