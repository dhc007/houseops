'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { Expense, ExpenseSplit, HouseMember } from '@/lib/supabase/types';
import {
    PlusIcon,
    FilterIcon,
    RefreshIcon,
    ChevronRightIcon,
    CheckIcon,
} from '@/components/ui/Icons';

type FilterType = 'all' | 'pending' | 'recurring';

const categoryEmojis: Record<string, string> = {
    rent: '🏠',
    utilities: '💡',
    groceries: '🛒',
    household: '🧹',
    internet: '📶',
    entertainment: '🎬',
    food: '🍕',
    transport: '🚕',
    other: '📦',
};

export default function ExpensesPage() {
    const { house, member, members } = useAuth();
    const supabase = createClient();

    const [expenses, setExpenses] = useState<(Expense & { splits?: ExpenseSplit[] })[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (house) {
            fetchExpenses();
        }
    }, [house]);

    const fetchExpenses = async () => {
        if (!house) return;

        const { data } = await supabase
            .from('expenses')
            .select('*, expense_splits(*)')
            .eq('house_id', house.id)
            .order('created_at', { ascending: false });

        setExpenses(data?.map(e => ({
            ...e,
            splits: e.expense_splits,
        })) || []);
        setIsLoading(false);
    };

    const handleMarkPaid = async (expenseId: string, splitId: string) => {
        await supabase
            .from('expense_splits')
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq('id', splitId);

        fetchExpenses();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const d = new Date(date);
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString();
    };

    const filteredExpenses = useMemo(() => {
        let result = expenses;

        if (filter === 'pending') {
            result = result.filter(e =>
                e.splits?.some(s => s.member_id === member?.id && !s.is_paid)
            );
        } else if (filter === 'recurring') {
            result = result.filter(e => e.is_recurring);
        }

        if (categoryFilter !== 'all') {
            result = result.filter(e => e.category === categoryFilter);
        }

        return result;
    }, [expenses, filter, categoryFilter, member]);

    const categories = useMemo(() => {
        const cats = new Set(expenses.map(e => e.category));
        return Array.from(cats);
    }, [expenses]);

    const getMemberName = (memberId: string | null) => {
        if (!memberId) return 'Unknown';
        return members.find(m => m.id === memberId)?.name || 'Unknown';
    };

    if (isLoading) {
        return (
            <div className="container py-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-background-tertiary rounded w-1/2" />
                    <div className="h-12 bg-background-tertiary rounded" />
                    <div className="h-24 bg-background-tertiary rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <section className="flex items-center justify-between animate-slide-up">
                <div>
                    <h2 className="text-2xl font-bold">Expenses</h2>
                    <p className="text-foreground-secondary text-sm">
                        {expenses.length} total expenses
                    </p>
                </div>
                <Link href="/expenses/add" className="btn btn-primary">
                    <PlusIcon size={20} />
                    Add
                </Link>
            </section>

            {/* Filters */}
            <section className="space-y-3 animate-slide-up stagger-1">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                    {(['all', 'pending', 'recurring'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} py-2 px-4 whitespace-nowrap`}
                        >
                            {f === 'all' && 'All'}
                            {f === 'pending' && '💵 Pending'}
                            {f === 'recurring' && '🔄 Recurring'}
                        </button>
                    ))}
                </div>

                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                        <button
                            onClick={() => setCategoryFilter('all')}
                            className={`btn btn-ghost py-1 px-3 text-sm ${categoryFilter === 'all' ? 'text-primary' : ''}`}
                        >
                            All Categories
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`btn btn-ghost py-1 px-3 text-sm whitespace-nowrap ${categoryFilter === cat ? 'text-primary' : ''}`}
                            >
                                {categoryEmojis[cat] || '📦'} {cat}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Expenses List */}
            <section className="space-y-3 animate-slide-up stagger-2">
                {filteredExpenses.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center text-3xl">
                            💸
                        </div>
                        <h3 className="font-semibold mb-2">No expenses yet</h3>
                        <p className="text-foreground-muted text-sm mb-4">
                            Start tracking your shared expenses
                        </p>
                        <Link href="/expenses/add" className="btn btn-primary">
                            Add First Expense
                        </Link>
                    </div>
                ) : (
                    filteredExpenses.map(expense => {
                        const mySplit = expense.splits?.find(s => s.member_id === member?.id);
                        const payer = members.find(m => m.id === expense.paid_by);
                        const isPayer = expense.paid_by === member?.id;

                        return (
                            <div key={expense.id} className="glass-card p-4">
                                <div className="flex items-start gap-4">
                                    {/* Category Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center text-2xl">
                                        {categoryEmojis[expense.category] || '📦'}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold truncate">{expense.title}</h4>
                                            {expense.is_recurring && (
                                                <RefreshIcon size={14} className="text-primary" />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 text-sm text-foreground-muted">
                                            <span>{payer?.name || 'Someone'} paid</span>
                                            <span>•</span>
                                            <span>{formatRelativeTime(expense.created_at)}</span>
                                        </div>

                                        {/* My Split Status */}
                                        {mySplit && !isPayer && (
                                            <div className="mt-2">
                                                {mySplit.is_paid ? (
                                                    <span className="badge badge-success">Paid</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="badge badge-warning">
                                                            You owe {formatCurrency(mySplit.amount)}
                                                        </span>
                                                        <button
                                                            onClick={() => handleMarkPaid(expense.id, mySplit.id)}
                                                            className="btn btn-ghost text-xs text-primary py-1 px-2"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right">
                                        <div className="font-bold text-lg">
                                            {formatCurrency(expense.amount)}
                                        </div>
                                        <div className="text-xs text-foreground-muted capitalize">
                                            {expense.split_type} split
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </section>
        </div>
    );
}
