// Utility functions for HouseOps

import { User, Expense, ExpenseSplit, Settlement, InventoryItem } from './types';

// ===== ID Generation =====
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ===== Currency Formatting =====
export function formatCurrency(amount: number, currency: string = '₹'): string {
    return `${currency}${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

// ===== Date Utilities =====
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
}

export function getDaysUntil(date: Date): number {
    const now = new Date();
    const diffMs = new Date(date).getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isOverdue(date: Date): boolean {
    return getDaysUntil(date) < 0;
}

// ===== Settlement Calculations =====
export function calculateSettlements(
    expenses: Expense[],
    members: User[]
): Settlement[] {
    // Build balance map: userId -> net balance (positive = owed, negative = owes)
    const balances: Map<string, number> = new Map();

    // Initialize balances
    members.forEach(m => balances.set(m.id, 0));

    // Calculate net balances from expenses
    expenses.forEach(expense => {
        expense.splits.forEach(split => {
            if (!split.paid) {
                // Person owes this amount
                const current = balances.get(split.userId) || 0;
                balances.set(split.userId, current - split.amount);

                // Payer is owed this amount
                const payerBalance = balances.get(expense.paidBy) || 0;
                balances.set(expense.paidBy, payerBalance + split.amount);
            }
        });
    });

    // Simplify debts using greedy algorithm
    const creditors: { user: User; amount: number }[] = [];
    const debtors: { user: User; amount: number }[] = [];

    balances.forEach((balance, userId) => {
        const user = members.find(m => m.id === userId);
        if (!user) return;

        if (balance > 0.01) {
            creditors.push({ user, amount: balance });
        } else if (balance < -0.01) {
            debtors.push({ user, amount: Math.abs(balance) });
        }
    });

    // Sort for optimal matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements: Settlement[] = [];

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0.01) {
            settlements.push({
                from: debtor.user,
                to: creditor.user,
                amount: Math.round(amount * 100) / 100,
            });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return settlements;
}

// ===== Inventory Predictions =====
export function predictDepleteDate(item: InventoryItem): Date | null {
    if (!item.averageConsumptionPerWeek || item.averageConsumptionPerWeek <= 0) {
        return null;
    }

    const weeksLeft = item.quantity / item.averageConsumptionPerWeek;
    const daysLeft = Math.floor(weeksLeft * 7);

    const depleteDate = new Date();
    depleteDate.setDate(depleteDate.getDate() + daysLeft);

    return depleteDate;
}

export function isLowStock(item: InventoryItem): boolean {
    return item.quantity <= item.threshold;
}

// ===== Expense Helpers =====
export function splitExpenseEqually(
    expenseId: string,
    amount: number,
    memberIds: string[],
    paidById: string
): ExpenseSplit[] {
    const splitAmount = Math.round((amount / memberIds.length) * 100) / 100;

    return memberIds.map(userId => ({
        id: generateId(),
        expenseId,
        userId,
        amount: splitAmount,
        paid: userId === paidById, // Payer has already "paid" their share
    }));
}

// ===== User Avatar =====
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// ===== Category Labels =====
export const expenseCategoryLabels: Record<string, string> = {
    rent: 'Rent',
    utilities: 'Utilities',
    groceries: 'Groceries',
    maintenance: 'Maintenance',
    other: 'Other',
};

export const taskCategoryLabels: Record<string, string> = {
    cleaning: 'Cleaning',
    garbage: 'Garbage',
    bills: 'Bill Payments',
    maintenance: 'Maintenance',
    other: 'Other',
};

export const inventoryCategoryLabels: Record<string, string> = {
    groceries: 'Groceries',
    utilities: 'Utilities',
    essentials: 'Essentials',
    other: 'Other',
};

// ===== Validation =====
export function validatePhone(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
