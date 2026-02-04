// Simple state management store using React Context + localStorage
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, User, House, HouseMember, Expense, InventoryItem, Task, Notification } from './types';
import { generateId, generateInviteCode } from './utils';

// ===== Initial State =====
const initialState: AppState = {
    user: null,
    house: null,
    members: [],
    expenses: [],
    inventory: [],
    tasks: [],
    notifications: [],
    isLoading: true,
};

// ===== Actions =====
type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'LOAD_STATE'; payload: Partial<AppState> }
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'SET_HOUSE'; payload: House | null }
    | { type: 'SET_MEMBERS'; payload: HouseMember[] }
    | { type: 'ADD_MEMBER'; payload: HouseMember }
    | { type: 'REMOVE_MEMBER'; payload: string }
    | { type: 'SET_EXPENSES'; payload: Expense[] }
    | { type: 'ADD_EXPENSE'; payload: Expense }
    | { type: 'UPDATE_EXPENSE'; payload: Expense }
    | { type: 'DELETE_EXPENSE'; payload: string }
    | { type: 'MARK_SPLIT_PAID'; payload: { expenseId: string; splitId: string } }
    | { type: 'SET_INVENTORY'; payload: InventoryItem[] }
    | { type: 'ADD_INVENTORY_ITEM'; payload: InventoryItem }
    | { type: 'UPDATE_INVENTORY_ITEM'; payload: InventoryItem }
    | { type: 'DELETE_INVENTORY_ITEM'; payload: string }
    | { type: 'SET_TASKS'; payload: Task[] }
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'MARK_NOTIFICATION_READ'; payload: string }
    | { type: 'CLEAR_NOTIFICATIONS' }
    | { type: 'LOGOUT' };

// ===== Reducer =====
function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'LOAD_STATE':
            return { ...state, ...action.payload, isLoading: false };

        case 'SET_USER':
            return { ...state, user: action.payload };

        case 'SET_HOUSE':
            return { ...state, house: action.payload };

        case 'SET_MEMBERS':
            return { ...state, members: action.payload };

        case 'ADD_MEMBER':
            return { ...state, members: [...state.members, action.payload] };

        case 'REMOVE_MEMBER':
            return { ...state, members: state.members.filter(m => m.id !== action.payload) };

        case 'SET_EXPENSES':
            return { ...state, expenses: action.payload };

        case 'ADD_EXPENSE':
            return { ...state, expenses: [action.payload, ...state.expenses] };

        case 'UPDATE_EXPENSE':
            return {
                ...state,
                expenses: state.expenses.map(e =>
                    e.id === action.payload.id ? action.payload : e
                ),
            };

        case 'DELETE_EXPENSE':
            return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

        case 'MARK_SPLIT_PAID':
            return {
                ...state,
                expenses: state.expenses.map(e =>
                    e.id === action.payload.expenseId
                        ? {
                            ...e,
                            splits: e.splits.map(s =>
                                s.id === action.payload.splitId
                                    ? { ...s, paid: true, paidAt: new Date() }
                                    : s
                            ),
                        }
                        : e
                ),
            };

        case 'SET_INVENTORY':
            return { ...state, inventory: action.payload };

        case 'ADD_INVENTORY_ITEM':
            return { ...state, inventory: [...state.inventory, action.payload] };

        case 'UPDATE_INVENTORY_ITEM':
            return {
                ...state,
                inventory: state.inventory.map(i =>
                    i.id === action.payload.id ? action.payload : i
                ),
            };

        case 'DELETE_INVENTORY_ITEM':
            return { ...state, inventory: state.inventory.filter(i => i.id !== action.payload) };

        case 'SET_TASKS':
            return { ...state, tasks: action.payload };

        case 'ADD_TASK':
            return { ...state, tasks: [...state.tasks, action.payload] };

        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t =>
                    t.id === action.payload.id ? action.payload : t
                ),
            };

        case 'DELETE_TASK':
            return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };

        case 'SET_NOTIFICATIONS':
            return { ...state, notifications: action.payload };

        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [action.payload, ...state.notifications] };

        case 'MARK_NOTIFICATION_READ':
            return {
                ...state,
                notifications: state.notifications.map(n =>
                    n.id === action.payload ? { ...n, read: true } : n
                ),
            };

        case 'CLEAR_NOTIFICATIONS':
            return { ...state, notifications: [] };

        case 'LOGOUT':
            return { ...initialState, isLoading: false };

        default:
            return state;
    }
}

// ===== Context =====
interface StoreContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;

    // Helper actions
    login: (user: User) => void;
    logout: () => void;
    createHouse: (name: string, rentAmount: number, settlementCycle: 'weekly' | 'monthly') => House;
    joinHouse: (house: House) => void;
    addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
    markSplitPaid: (expenseId: string, splitId: string) => void;
    addInventoryItem: (item: Omit<InventoryItem, 'id'>) => InventoryItem;
    updateInventoryItem: (item: InventoryItem) => void;
    addTask: (task: Omit<Task, 'id'>) => Task;
    completeTask: (taskId: string) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ===== Provider =====
const STORAGE_KEY = 'houseops_state';

export function StoreProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Load state from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                dispatch({ type: 'LOAD_STATE', payload: parsed });
            } else {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        } catch (e) {
            console.error('Failed to load state:', e);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    // Save state to localStorage on changes
    useEffect(() => {
        if (!state.isLoading) {
            const toSave = {
                user: state.user,
                house: state.house,
                members: state.members,
                expenses: state.expenses,
                inventory: state.inventory,
                tasks: state.tasks,
                notifications: state.notifications,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        }
    }, [state]);

    // Helper actions
    const login = (user: User) => {
        dispatch({ type: 'SET_USER', payload: user });
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        dispatch({ type: 'LOGOUT' });
    };

    const createHouse = (name: string, rentAmount: number, settlementCycle: 'weekly' | 'monthly'): House => {
        const house: House = {
            id: generateId(),
            name,
            rentAmount,
            settlementCycle,
            createdAt: new Date(),
            adminId: state.user!.id,
            inviteCode: generateInviteCode(),
        };

        dispatch({ type: 'SET_HOUSE', payload: house });

        // Add current user as admin member
        const member: HouseMember = {
            id: generateId(),
            houseId: house.id,
            userId: state.user!.id,
            user: state.user!,
            role: 'admin',
            joinedAt: new Date(),
        };
        dispatch({ type: 'ADD_MEMBER', payload: member });

        return house;
    };

    const joinHouse = (house: House) => {
        dispatch({ type: 'SET_HOUSE', payload: house });

        // Add current user as member
        const member: HouseMember = {
            id: generateId(),
            houseId: house.id,
            userId: state.user!.id,
            user: state.user!,
            role: 'member',
            joinedAt: new Date(),
        };
        dispatch({ type: 'ADD_MEMBER', payload: member });
    };

    const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense => {
        const expense: Expense = {
            ...expenseData,
            id: generateId(),
            createdAt: new Date(),
        };
        dispatch({ type: 'ADD_EXPENSE', payload: expense });
        return expense;
    };

    const markSplitPaid = (expenseId: string, splitId: string) => {
        dispatch({ type: 'MARK_SPLIT_PAID', payload: { expenseId, splitId } });
    };

    const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>): InventoryItem => {
        const item: InventoryItem = {
            ...itemData,
            id: generateId(),
        };
        dispatch({ type: 'ADD_INVENTORY_ITEM', payload: item });
        return item;
    };

    const updateInventoryItem = (item: InventoryItem) => {
        dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: item });
    };

    const addTask = (taskData: Omit<Task, 'id'>): Task => {
        const task: Task = {
            ...taskData,
            id: generateId(),
        };
        dispatch({ type: 'ADD_TASK', payload: task });
        return task;
    };

    const completeTask = (taskId: string) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            dispatch({
                type: 'UPDATE_TASK',
                payload: { ...task, status: 'completed', completedAt: new Date() },
            });
        }
    };

    const addNotification = (notifData: Omit<Notification, 'id' | 'createdAt'>) => {
        const notification: Notification = {
            ...notifData,
            id: generateId(),
            createdAt: new Date(),
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    };

    return (
        <StoreContext.Provider
            value={{
                state,
                dispatch,
                login,
                logout,
                createHouse,
                joinHouse,
                addExpense,
                markSplitPaid,
                addInventoryItem,
                updateInventoryItem,
                addTask,
                completeTask,
                addNotification,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

// ===== Hook =====
export function useStore(): StoreContextType {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
