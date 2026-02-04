-- HouseOps Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Houses table
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  rent_amount DECIMAL(10,2) DEFAULT 0,
  settlement_cycle TEXT DEFAULT 'monthly',
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- House Members table (supports both users with and without accounts)
CREATE TABLE IF NOT EXISTS house_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  has_account BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitors/Guests table
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invited_by UUID REFERENCES house_members(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  include_in_splits BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'room', 'custom')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day INTEGER,
  paid_by UUID REFERENCES house_members(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID REFERENCES house_members(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ
);

-- Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  unit TEXT,
  threshold INTEGER DEFAULT 2,
  assigned_to UUID REFERENCES house_members(id) ON DELETE SET NULL,
  last_purchased TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  assigned_to UUID REFERENCES house_members(id) ON DELETE SET NULL,
  rotation_frequency TEXT DEFAULT 'weekly' CHECK (rotation_frequency IN ('none', 'daily', 'weekly', 'monthly')),
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  house_id UUID REFERENCES houses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Houses: Members can view their houses
CREATE POLICY "House members can view house" ON houses FOR SELECT 
  USING (id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create houses" ON houses FOR INSERT 
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "House admins can update" ON houses FOR UPDATE 
  USING (id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid() AND role = 'admin'));

-- House Members: Members can view their housemates
CREATE POLICY "View house members" ON house_members FOR SELECT 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage members" ON house_members FOR ALL 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Visitors: House members can manage visitors
CREATE POLICY "View visitors" ON visitors FOR SELECT 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can add visitors" ON visitors FOR INSERT 
  WITH CHECK (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Expenses: House members can view and create
CREATE POLICY "View expenses" ON expenses FOR SELECT 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));
CREATE POLICY "Create expenses" ON expenses FOR INSERT 
  WITH CHECK (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Expense Splits: Viewable by house members
CREATE POLICY "View expense splits" ON expense_splits FOR SELECT 
  USING (expense_id IN (SELECT id FROM expenses WHERE house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid())));

-- Inventory: House members can manage
CREATE POLICY "View inventory" ON inventory_items FOR SELECT 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));
CREATE POLICY "Manage inventory" ON inventory_items FOR ALL 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Tasks: House members can manage
CREATE POLICY "View tasks" ON tasks FOR SELECT 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));
CREATE POLICY "Manage tasks" ON tasks FOR ALL 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));

-- Rooms: House members can view
CREATE POLICY "View rooms" ON rooms FOR SELECT 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage rooms" ON rooms FOR ALL 
  USING (house_id IN (SELECT house_id FROM house_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Notifications: Users see their own
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_house_members_house_id ON house_members(house_id);
CREATE INDEX IF NOT EXISTS idx_house_members_user_id ON house_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_house_id ON expenses(house_id);
CREATE INDEX IF NOT EXISTS idx_visitors_house_id ON visitors(house_id);
CREATE INDEX IF NOT EXISTS idx_tasks_house_id ON tasks(house_id);
CREATE INDEX IF NOT EXISTS idx_inventory_house_id ON inventory_items(house_id);
CREATE INDEX IF NOT EXISTS idx_houses_invite_code ON houses(invite_code);
