// TypeScript types for Supabase database

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    name: string;
                    email: string | null;
                    phone: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    name: string;
                    email?: string | null;
                    phone?: string | null;
                    avatar_url?: string | null;
                };
                Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
            };
            houses: {
                Row: {
                    id: string;
                    name: string;
                    rent_amount: number;
                    settlement_cycle: 'weekly' | 'biweekly' | 'monthly';
                    invite_code: string;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    name: string;
                    rent_amount?: number;
                    settlement_cycle?: 'weekly' | 'biweekly' | 'monthly';
                    invite_code: string;
                    created_by: string;
                };
                Update: Partial<Database['public']['Tables']['houses']['Insert']>;
            };
            rooms: {
                Row: {
                    id: string;
                    house_id: string;
                    name: string;
                    created_at: string;
                };
                Insert: {
                    house_id: string;
                    name: string;
                };
                Update: Partial<Database['public']['Tables']['rooms']['Insert']>;
            };
            house_members: {
                Row: {
                    id: string;
                    house_id: string;
                    user_id: string | null;
                    name: string;
                    email: string | null;
                    phone: string | null;
                    avatar_url: string | null;
                    role: 'admin' | 'member';
                    room_id: string | null;
                    has_account: boolean;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    house_id: string;
                    user_id?: string | null;
                    name: string;
                    email?: string | null;
                    phone?: string | null;
                    avatar_url?: string | null;
                    role?: 'admin' | 'member';
                    room_id?: string | null;
                    has_account?: boolean;
                    is_active?: boolean;
                };
                Update: Partial<Database['public']['Tables']['house_members']['Insert']>;
            };
            visitors: {
                Row: {
                    id: string;
                    house_id: string;
                    name: string;
                    invited_by: string | null;
                    start_date: string;
                    end_date: string | null;
                    include_in_splits: boolean;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    house_id: string;
                    name: string;
                    invited_by?: string | null;
                    start_date: string;
                    end_date?: string | null;
                    include_in_splits?: boolean;
                    notes?: string | null;
                };
                Update: Partial<Database['public']['Tables']['visitors']['Insert']>;
            };
            expenses: {
                Row: {
                    id: string;
                    house_id: string;
                    title: string;
                    amount: number;
                    category: string;
                    split_type: 'equal' | 'room' | 'custom';
                    is_recurring: boolean;
                    recurring_day: number | null;
                    paid_by: string | null;
                    created_by: string | null;
                    created_at: string;
                };
                Insert: {
                    house_id: string;
                    title: string;
                    amount: number;
                    category: string;
                    split_type?: 'equal' | 'room' | 'custom';
                    is_recurring?: boolean;
                    recurring_day?: number | null;
                    paid_by?: string | null;
                    created_by?: string | null;
                };
                Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
            };
            expense_splits: {
                Row: {
                    id: string;
                    expense_id: string;
                    member_id: string;
                    visitor_id: string | null;
                    amount: number;
                    is_paid: boolean;
                    paid_at: string | null;
                };
                Insert: {
                    expense_id: string;
                    member_id: string;
                    visitor_id?: string | null;
                    amount: number;
                    is_paid?: boolean;
                    paid_at?: string | null;
                };
                Update: Partial<Database['public']['Tables']['expense_splits']['Insert']>;
            };
            inventory_items: {
                Row: {
                    id: string;
                    house_id: string;
                    name: string;
                    category: string | null;
                    quantity: number;
                    unit: string | null;
                    threshold: number;
                    assigned_to: string | null;
                    last_purchased: string | null;
                    created_at: string;
                };
                Insert: {
                    house_id: string;
                    name: string;
                    category?: string | null;
                    quantity?: number;
                    unit?: string | null;
                    threshold?: number;
                    assigned_to?: string | null;
                };
                Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>;
            };
            tasks: {
                Row: {
                    id: string;
                    house_id: string;
                    title: string;
                    category: string | null;
                    assigned_to: string | null;
                    rotation_frequency: 'none' | 'daily' | 'weekly' | 'monthly';
                    due_date: string | null;
                    status: 'pending' | 'completed' | 'overdue';
                    completed_at: string | null;
                    created_at: string;
                };
                Insert: {
                    house_id: string;
                    title: string;
                    category?: string | null;
                    assigned_to?: string | null;
                    rotation_frequency?: 'none' | 'daily' | 'weekly' | 'monthly';
                    due_date?: string | null;
                    status?: 'pending' | 'completed' | 'overdue';
                };
                Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    house_id: string;
                    type: string;
                    title: string;
                    message: string | null;
                    read: boolean;
                    created_at: string;
                };
                Insert: {
                    user_id: string;
                    house_id: string;
                    type: string;
                    title: string;
                    message?: string | null;
                    read?: boolean;
                };
                Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
            };
        };
    };
}

// Convenient type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type House = Database['public']['Tables']['houses']['Row'];
export type Room = Database['public']['Tables']['rooms']['Row'];
export type HouseMember = Database['public']['Tables']['house_members']['Row'];
export type Visitor = Database['public']['Tables']['visitors']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseSplit = Database['public']['Tables']['expense_splits']['Row'];
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type HouseInsert = Database['public']['Tables']['houses']['Insert'];
export type HouseMemberInsert = Database['public']['Tables']['house_members']['Insert'];
export type VisitorInsert = Database['public']['Tables']['visitors']['Insert'];
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type ExpenseSplitInsert = Database['public']['Tables']['expense_splits']['Insert'];
export type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
