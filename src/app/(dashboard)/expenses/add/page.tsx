'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { Visitor } from '@/lib/supabase/types';
import { ChevronLeftIcon } from '@/components/ui/Icons';

const categories = [
    { value: 'rent', label: 'Rent', emoji: '🏠' },
    { value: 'utilities', label: 'Utilities', emoji: '💡' },
    { value: 'groceries', label: 'Groceries', emoji: '🛒' },
    { value: 'household', label: 'Household', emoji: '🧹' },
    { value: 'internet', label: 'Internet', emoji: '📶' },
    { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
    { value: 'food', label: 'Food/Dining', emoji: '🍕' },
    { value: 'transport', label: 'Transport', emoji: '🚕' },
    { value: 'other', label: 'Other', emoji: '📦' },
];

const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

export default function AddExpensePage() {
    const router = useRouter();
    const { house, member, members } = useAuth();
    const supabase = createClient();

    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('groceries');
    const [paidBy, setPaidBy] = useState(member?.id || '');
    const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
    const [isRecurring, setIsRecurring] = useState(false);
    const [includeVisitors, setIncludeVisitors] = useState(false);
    const [customSplits, setCustomSplits] = useState<Record<string, number>>({});

    useEffect(() => {
        if (member) {
            setPaidBy(member.id);
        }
        if (house) {
            fetchVisitors();
        }
    }, [member, house]);

    const fetchVisitors = async () => {
        if (!house) return;
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('visitors')
            .select('*')
            .eq('house_id', house.id)
            .eq('include_in_splits', true)
            .or(`end_date.is.null,end_date.gte.${today}`);

        setVisitors(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!house || !member || !amount || !title) return;

        setIsLoading(true);
        setError('');

        try {
            const expenseAmount = parseFloat(amount);

            // Create expense
            const { data: expense, error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    house_id: house.id,
                    title: title.trim(),
                    amount: expenseAmount,
                    category,
                    split_type: splitType,
                    is_recurring: isRecurring,
                    paid_by: paidBy,
                    created_by: member.user_id,
                })
                .select()
                .single();

            if (expenseError) throw expenseError;

            // Create splits
            const splitParticipants = [...members];
            const visitorParticipants = includeVisitors ? visitors : [];
            const totalParticipants = splitParticipants.length + visitorParticipants.length;

            if (splitType === 'equal') {
                const splitAmount = expenseAmount / totalParticipants;

                // Member splits
                const memberSplits = splitParticipants.map(m => ({
                    expense_id: expense.id,
                    member_id: m.id,
                    amount: splitAmount,
                    is_paid: m.id === paidBy, // Payer's share is already "paid"
                    paid_at: m.id === paidBy ? new Date().toISOString() : null,
                }));

                await supabase.from('expense_splits').insert(memberSplits);

                // Visitor splits
                if (visitorParticipants.length > 0) {
                    const visitorSplits = visitorParticipants.map(v => ({
                        expense_id: expense.id,
                        member_id: paidBy, // Assign to payer for tracking
                        visitor_id: v.id,
                        amount: splitAmount,
                        is_paid: false,
                    }));

                    await supabase.from('expense_splits').insert(visitorSplits);
                }
            } else {
                // Custom splits
                const splits = Object.entries(customSplits).map(([memberId, amt]) => ({
                    expense_id: expense.id,
                    member_id: memberId,
                    amount: amt,
                    is_paid: memberId === paidBy,
                    paid_at: memberId === paidBy ? new Date().toISOString() : null,
                }));

                await supabase.from('expense_splits').insert(splits);
            }

            router.push('/expenses');

        } catch (err: any) {
            setError(err.message || 'Failed to add expense');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <section className="flex items-center gap-4 animate-slide-up">
                <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
                    <ChevronLeftIcon size={24} />
                </button>
                <h1 className="text-2xl font-bold">Add Expense</h1>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up stagger-1">
                {/* Amount */}
                <section className="glass-card p-6">
                    <label className="label">Amount</label>
                    <div className="flex items-center gap-2 text-3xl">
                        <span className="text-foreground-muted">₹</span>
                        <input
                            type="number"
                            className="input text-3xl font-bold bg-transparent border-none p-0 focus:ring-0"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                        {quickAmounts.map(amt => (
                            <button
                                key={amt}
                                type="button"
                                onClick={() => setAmount(amt.toString())}
                                className="btn btn-secondary py-1 px-3 text-sm"
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Title */}
                <section className="glass-card p-6">
                    <label className="label">What was this for?</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="e.g., Monthly groceries, WiFi bill"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </section>

                {/* Category */}
                <section className="glass-card p-6">
                    <label className="label">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value)}
                                className={`
                  p-3 rounded-xl border transition-all text-center
                  ${category === cat.value
                                        ? 'bg-primary/20 border-primary'
                                        : 'bg-background-secondary border-glass-border'
                                    }
                `}
                            >
                                <span className="text-xl block">{cat.emoji}</span>
                                <span className="text-xs">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Paid By */}
                <section className="glass-card p-6">
                    <label className="label">Paid by</label>
                    <select
                        className="input"
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                        required
                    >
                        {members.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.name} {m.id === member?.id ? '(You)' : ''}
                            </option>
                        ))}
                    </select>
                </section>

                {/* Split Type */}
                <section className="glass-card p-6">
                    <label className="label">Split</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSplitType('equal')}
                            className={`btn flex-1 ${splitType === 'equal' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            Equal Split
                        </button>
                        <button
                            type="button"
                            onClick={() => setSplitType('custom')}
                            className={`btn flex-1 ${splitType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            Custom
                        </button>
                    </div>

                    {splitType === 'equal' && (
                        <p className="text-sm text-foreground-muted mt-3">
                            Split equally among {members.length} members
                            {includeVisitors && visitors.length > 0 && ` + ${visitors.length} visitor(s)`}
                        </p>
                    )}
                </section>

                {/* Include Visitors */}
                {visitors.length > 0 && (
                    <section className="glass-card p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeVisitors}
                                onChange={(e) => setIncludeVisitors(e.target.checked)}
                                className="w-5 h-5 rounded accent-primary"
                            />
                            <div>
                                <p className="font-medium">Include visitors in split</p>
                                <p className="text-sm text-foreground-muted">
                                    {visitors.map(v => v.name).join(', ')}
                                </p>
                            </div>
                        </label>
                    </section>
                )}

                {/* Recurring */}
                <section className="glass-card p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                            className="w-5 h-5 rounded accent-primary"
                        />
                        <div>
                            <p className="font-medium">Recurring expense</p>
                            <p className="text-sm text-foreground-muted">This repeats monthly</p>
                        </div>
                    </label>
                </section>

                {error && (
                    <p className="text-danger text-center">{error}</p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading || !amount || !title}
                    className="btn btn-primary w-full py-4 text-lg"
                >
                    {isLoading ? 'Adding...' : 'Add Expense'}
                </button>
            </form>
        </div>
    );
}
