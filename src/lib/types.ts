// HouseOps Type Definitions

// ===== User & Auth =====
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export type AuthProvider = 'otp' | 'google';

// ===== House & Members =====
export interface House {
  id: string;
  name: string;
  rentAmount: number;
  settlementCycle: 'weekly' | 'monthly';
  createdAt: Date;
  adminId: string;
  inviteCode: string;
}

export type MemberRole = 'admin' | 'member' | 'viewer';

export interface HouseMember {
  id: string;
  houseId: string;
  userId: string;
  user: User;
  role: MemberRole;
  joinedAt: Date;
}

// ===== Expenses =====
export type SplitType = 'equal' | 'room_based' | 'custom';
export type ExpenseCategory = 'rent' | 'utilities' | 'groceries' | 'maintenance' | 'other';

export interface Expense {
  id: string;
  houseId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  recurring: boolean;
  recurringDay?: number; // Day of month for recurring
  paidBy: string; // User ID
  createdAt: Date;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  paid: boolean;
  paidAt?: Date;
}

export interface Settlement {
  from: User;
  to: User;
  amount: number;
}

// ===== Inventory =====
export type InventoryCategory = 'groceries' | 'utilities' | 'essentials' | 'other';

export interface InventoryItem {
  id: string;
  houseId: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  threshold: number; // Low stock threshold
  assignedTo?: string; // User ID for purchasing
  lastPurchased?: Date;
  averageConsumptionPerWeek?: number;
}

// ===== Tasks =====
export type TaskCategory = 'cleaning' | 'garbage' | 'bills' | 'maintenance' | 'other';
export type RotationFrequency = 'daily' | 'weekly' | 'monthly' | 'none';
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Task {
  id: string;
  houseId: string;
  title: string;
  category: TaskCategory;
  assignedTo: string; // User ID
  rotationFrequency: RotationFrequency;
  dueDate: Date;
  status: TaskStatus;
  completedAt?: Date;
}

// ===== Notifications =====
export type NotificationType = 'expense' | 'inventory' | 'task' | 'settlement' | 'reminder';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// ===== App State =====
export interface AppState {
  user: User | null;
  house: House | null;
  members: HouseMember[];
  expenses: Expense[];
  inventory: InventoryItem[];
  tasks: Task[];
  notifications: Notification[];
  isLoading: boolean;
}
