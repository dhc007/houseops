'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { Expense, ExpenseSplit, InventoryItem, Task, Visitor } from '@/lib/supabase/types';
import {
    PlusIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    ChevronRightIcon,
    AlertIcon,
    RefreshIcon,
    UsersIcon,
} from '@/components/ui/Icons';

export default function DashboardPage() {
    const { profile, house, member, members } = useAuth();
    const supabase = createClient();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [splits, setSplits] = useState<ExpenseSplit[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (house) {
            fetchData();
        }
    }, [house]);

    const fetchData = async () => {
        if (!house) return;

        // Fetch expenses with splits
        const { data: expensesData } = await supabase
            .from('expenses')
            .select('*')
            .eq('house_id', house.id)
            .order('created_at', { ascending: false })
            .limit(10);

        setExpenses(expensesData || []);

        // Fetch splits for current member
        if (member) {
            const { data: splitsData } = await supabase
                .from('expense_splits')
                .select('*, expenses(*)')
                .eq('member_id', member.id);

            setSplits(splitsData || []);
        }

        // Fetch inventory
        const { data: inventoryData } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('house_id', house.id);

        setInventory(inventoryData || []);

        // Fetch tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('house_id', house.id)
            .eq('status', 'pending');

        setTasks(tasksData || []);

        // Fetch active visitors
        const today = new Date().toISOString().split('T')[0];
        const { data: visitorsData } = await supabase
            .from('visitors')
            .select('*')
            .eq('house_id', house.id)
            .or(`end_date.is.null,end_date.gte.${today}`);

        setVisitors(visitorsData || []);

        setIsLoading(false);
    };

    // Calculate balances
    const stats = useMemo(() => {
        let youOwe = 0;
        let owedToYou = 0;

        // Calculate what you owe (unpaid splits where you're not the payer)
        splits.forEach(split => {
            if (!split.is_paid) {
                const expense = split.expenses as unknown as Expense;
                if (expense && expense.paid_by !== member?.id) {
                    youOwe += split.amount;
                }
            }
        });

        // Calculate what others owe you (their unpaid splits on expenses you paid)
        // This would require fetching all splits, simplified for now

        return { youOwe, owedToYou };
    }, [splits, member]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
    const myTasks = tasks.filter(t => t.assigned_to === member?.id);

    if (isLoading) {
        return (
            <div className="container py-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-background-tertiary rounded w-1/2" />
                    <div className="h-32 bg-background-tertiary rounded" />
                    <div className="h-32 bg-background-tertiary rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6">
            {/* Welcome Section */}
            <section className="animate-slide-up">
                <h2 className="text-2xl font-bold">
                    Hi, {profile?.name?.split(' ')[0]} 👋
                </h2>
                <p className="text-foreground-secondary">
                    {house?.name} • {members.length} members
                    {visitors.length > 0 && ` • ${visitors.length} visitor${visitors.length > 1 ? 's' : ''}`}
                </p>
            </section>

            {/* Balance Cards */}
            <section className="grid grid-cols-2 gap-4 animate-slide-up stagger-1">
                <div className="glass-card stat-card">
                    <div className="flex items-center gap-2 text-danger mb-2">
                        <TrendingDownIcon size={20} />
                        <span className="text-sm font-medium">You Owe</span>
                    </div>
                    <div className="stat-value text-danger">
                        {formatCurrency(stats.youOwe)}
                    </div>
                </div>

                <div className="glass-card stat-card">
                    <div className="flex items-center gap-2 text-success mb-2">
                        <TrendingUpIcon size={20} />
                        <span className="text-sm font-medium">Owed to You</span>
                    </div>
                    <div className="stat-value text-success">
                        {formatCurrency(stats.owedToYou)}
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="flex gap-3 animate-slide-up stagger-2">
                <Link href="/expenses/add" className="btn btn-primary flex-1">
                    <PlusIcon size={20} />
                    Add Expense
                </Link>
                <Link href="/members" className="btn btn-secondary">
                    <UsersIcon size={20} />
                    {members.length}
                </Link>
            </section>

            {/* Visitors Alert */}
            {visitors.length > 0 && (
                <section className="glass-card p-4 border-warning/30 animate-slide-up stagger-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-lg">
                            👤
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Active Visitors</h4>
                            <p className="text-sm text-foreground-muted">
                                {visitors.map(v => v.name).join(', ')}
                            </p>
                        </div>
                        <Link href="/members" className="btn btn-ghost btn-icon">
                            <ChevronRightIcon size={20} />
                        </Link>
                    </div>
                </section>
            )}

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
                <section className="animate-slide-up stagger-3">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <AlertIcon size={18} className="text-warning" />
                            Low Stock ({lowStockItems.length})
                        </h3>
                        <Link href="/inventory" className="text-primary text-sm">View all</Link>
                    </div>
                    <div className="glass-card divide-y divide-glass-border">
                        {lowStockItems.slice(0, 3).map(item => (
                            <div key={item.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">{item.name}</h4>
                                    <p className="text-sm text-danger">Only {item.quantity} {item.unit} left</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Pending Tasks */}
            {myTasks.length > 0 && (
                <section className="animate-slide-up stagger-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Your Tasks ({myTasks.length})</h3>
                        <Link href="/tasks" className="text-primary text-sm">View all</Link>
                    </div>
                    <div className="glass-card divide-y divide-glass-border">
                        {myTasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                                    ✓
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium">{task.title}</h4>
                                    {task.due_date && (
                                        <p className="text-sm text-foreground-muted">
                                            Due {new Date(task.due_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Recent Expenses */}
            {expenses.length > 0 && (
                <section className="animate-slide-up stagger-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Recent Expenses</h3>
                        <Link href="/expenses" className="text-primary text-sm">View all</Link>
                    </div>
                    <div className="glass-card divide-y divide-glass-border">
                        {expenses.slice(0, 5).map(expense => {
                            const payer = members.find(m => m.id === expense.paid_by);
                            return (
                                <div key={expense.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">{expense.title}</h4>
                                        <p className="text-sm text-foreground-muted">
                                            {payer?.name || 'Someone'} paid
                                        </p>
                                    </div>
                                    <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {expenses.length === 0 && tasks.length === 0 && (
                <section className="glass-card p-8 text-center animate-slide-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center text-3xl">
                        🏠
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Welcome to {house?.name}!</h3>
                    <p className="text-foreground-muted mb-4">
                        Start by adding your first expense or inviting roommates.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Link href="/expenses/add" className="btn btn-primary">
                            Add Expense
                        </Link>
                        <Link href="/members" className="btn btn-secondary">
                            Invite Members
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}
