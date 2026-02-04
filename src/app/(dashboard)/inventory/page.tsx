'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { InventoryItem } from '@/lib/supabase/types';
import {
    PlusIcon,
    XIcon,
} from '@/components/ui/Icons';

const categoryEmojis: Record<string, string> = {
    groceries: '🛒',
    cleaning: '🧹',
    toiletries: '🧴',
    kitchen: '🍳',
    other: '📦',
};

export default function InventoryPage() {
    const { house, member, members } = useAuth();
    const supabase = createClient();

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [newItem, setNewItem] = useState({
        name: '',
        category: 'groceries',
        unit: 'pcs',
        threshold: 2,
    });

    useEffect(() => {
        if (house) {
            fetchItems();
        }
    }, [house]);

    const fetchItems = async () => {
        if (!house) return;

        const { data } = await supabase
            .from('inventory_items')
            .select('*')
            .eq('house_id', house.id)
            .order('name');

        setItems(data || []);
        setIsLoading(false);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!house || !newItem.name.trim()) return;

        await supabase
            .from('inventory_items')
            .insert({
                house_id: house.id,
                name: newItem.name.trim(),
                category: newItem.category,
                unit: newItem.unit,
                threshold: newItem.threshold,
                quantity: 0,
            });

        setNewItem({ name: '', category: 'groceries', unit: 'pcs', threshold: 2 });
        setShowAddModal(false);
        fetchItems();
    };

    const handleUpdateQuantity = async (itemId: string, delta: number) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newQuantity = Math.max(0, item.quantity + delta);

        await supabase
            .from('inventory_items')
            .update({ quantity: newQuantity })
            .eq('id', itemId);

        setItems(items.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
    };

    const handleMarkPurchased = async (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        await supabase
            .from('inventory_items')
            .update({
                quantity: item.threshold + 3,
                last_purchased: new Date().toISOString(),
                assigned_to: member?.id,
            })
            .eq('id', itemId);

        fetchItems();
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Remove this item from inventory?')) return;

        await supabase
            .from('inventory_items')
            .delete()
            .eq('id', itemId);

        fetchItems();
    };

    const filteredItems = filter === 'all'
        ? items
        : filter === 'low'
            ? items.filter(i => i.quantity <= i.threshold)
            : items.filter(i => i.category === filter);

    const lowStockCount = items.filter(i => i.quantity <= i.threshold).length;

    if (isLoading) {
        return (
            <div className="container py-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-background-tertiary rounded w-1/2" />
                    <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-background-tertiary rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <section className="flex items-center justify-between animate-slide-up">
                <div>
                    <h2 className="text-2xl font-bold">Inventory</h2>
                    <p className="text-foreground-secondary text-sm">
                        {items.length} items tracked
                    </p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    <PlusIcon size={20} />
                    Add
                </button>
            </section>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
                <section className="glass-card p-4 border-warning/30 animate-slide-up stagger-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-lg">
                            ⚠️
                        </div>
                        <div>
                            <h4 className="font-medium">{lowStockCount} items running low</h4>
                            <p className="text-sm text-foreground-muted">Time to restock!</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Filters */}
            <section className="animate-slide-up stagger-1">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} py-2 px-4`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('low')}
                        className={`btn ${filter === 'low' ? 'btn-primary' : 'btn-secondary'} py-2 px-4`}
                    >
                        ⚠️ Low Stock
                    </button>
                    {Object.entries(categoryEmojis).map(([cat, emoji]) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`btn ${filter === cat ? 'btn-primary' : 'btn-secondary'} py-2 px-4 whitespace-nowrap`}
                        >
                            {emoji} {cat}
                        </button>
                    ))}
                </div>
            </section>

            {/* Items Grid */}
            <section className="grid grid-cols-2 gap-4 animate-slide-up stagger-2">
                {filteredItems.length === 0 ? (
                    <div className="col-span-2 glass-card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center text-3xl">
                            📦
                        </div>
                        <h3 className="font-semibold mb-2">No items yet</h3>
                        <p className="text-foreground-muted text-sm mb-4">
                            Start tracking your household supplies
                        </p>
                        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                            Add First Item
                        </button>
                    </div>
                ) : (
                    filteredItems.map(item => {
                        const isLow = item.quantity <= item.threshold;
                        return (
                            <div
                                key={item.id}
                                className={`glass-card p-4 ${isLow ? 'border-warning/50' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className="text-xl">{categoryEmojis[item.category || 'other']}</span>
                                        <h4 className="font-medium mt-1">{item.name}</h4>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="btn btn-ghost btn-icon text-foreground-muted hover:text-danger p-1"
                                    >
                                        <XIcon size={16} />
                                    </button>
                                </div>

                                <div className={`text-lg font-bold ${isLow ? 'text-warning' : ''}`}>
                                    {item.quantity} {item.unit}
                                </div>

                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={() => handleUpdateQuantity(item.id, -1)}
                                        className="btn btn-secondary btn-icon py-1 px-3"
                                    >
                                        -
                                    </button>
                                    <button
                                        onClick={() => handleUpdateQuantity(item.id, 1)}
                                        className="btn btn-secondary btn-icon py-1 px-3"
                                    >
                                        +
                                    </button>
                                    {isLow && (
                                        <button
                                            onClick={() => handleMarkPurchased(item.id)}
                                            className="btn btn-primary py-1 px-3 text-sm flex-1"
                                        >
                                            Restock
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </section>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Add Item</h3>
                            <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-icon">
                                <XIcon size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="label">Item Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Milk, Dish soap"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Unit</label>
                                    <select
                                        className="input"
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                    >
                                        <option value="pcs">pcs</option>
                                        <option value="kg">kg</option>
                                        <option value="L">L</option>
                                        <option value="packs">packs</option>
                                        <option value="bottles">bottles</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Low Stock At</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={newItem.threshold}
                                        onChange={(e) => setNewItem({ ...newItem, threshold: parseInt(e.target.value) || 1 })}
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(categoryEmojis).map(([cat, emoji]) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNewItem({ ...newItem, category: cat })}
                                            className={`
                        p-2 rounded-xl border transition-all text-center
                        ${newItem.category === cat
                                                    ? 'bg-primary/20 border-primary'
                                                    : 'bg-background-secondary border-glass-border'
                                                }
                      `}
                                        >
                                            <span className="text-xl block">{emoji}</span>
                                            <span className="text-xs capitalize">{cat}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-full">
                                Add Item
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
