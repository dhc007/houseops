'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/supabase/types';
import {
    PlusIcon,
    CheckIcon,
    RefreshIcon,
    CalendarIcon,
    XIcon,
} from '@/components/ui/Icons';

type TaskStatus = 'pending' | 'completed' | 'overdue';

const categoryEmojis: Record<string, string> = {
    cleaning: '🧹',
    garbage: '🗑️',
    bills: '💳',
    maintenance: '🔧',
    shopping: '🛒',
    other: '📋',
};

export default function TasksPage() {
    const { house, member, members } = useAuth();
    const supabase = createClient();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [newTask, setNewTask] = useState({
        title: '',
        category: 'cleaning',
        assigned_to: member?.id || '',
        due_date: '',
    });

    useEffect(() => {
        if (house) {
            fetchTasks();
        }
    }, [house]);

    useEffect(() => {
        if (member) {
            setNewTask(prev => ({ ...prev, assigned_to: member.id }));
        }
    }, [member]);

    const fetchTasks = async () => {
        if (!house) return;

        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('house_id', house.id)
            .order('due_date', { ascending: true });

        setTasks(data || []);
        setIsLoading(false);
    };

    const getTaskStatus = (task: Task): TaskStatus => {
        if (task.status === 'completed') return 'completed';
        if (task.due_date && new Date(task.due_date) < new Date()) return 'overdue';
        return 'pending';
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!house || !newTask.title.trim()) return;

        const dueDate = newTask.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        await supabase
            .from('tasks')
            .insert({
                house_id: house.id,
                title: newTask.title.trim(),
                category: newTask.category,
                assigned_to: newTask.assigned_to || null,
                due_date: dueDate,
                status: 'pending',
            });

        setNewTask({ title: '', category: 'cleaning', assigned_to: member?.id || '', due_date: '' });
        setShowAddModal(false);
        fetchTasks();
    };

    const handleCompleteTask = async (taskId: string) => {
        await supabase
            .from('tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
            })
            .eq('id', taskId);

        fetchTasks();
    };

    const handleDeleteTask = async (taskId: string) => {
        await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        fetchTasks();
    };

    const filteredTasks = useMemo(() => {
        let result = tasks.map(t => ({ ...t, computedStatus: getTaskStatus(t) }));

        if (filter !== 'all') {
            result = result.filter(t => t.computedStatus === filter);
        }

        return result;
    }, [tasks, filter]);

    const getMemberName = (memberId: string | null) => {
        if (!memberId) return 'Unassigned';
        return members.find(m => m.id === memberId)?.name || 'Unknown';
    };

    const getDaysUntil = (date: string) => {
        const now = new Date();
        const due = new Date(date);
        const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const pendingCount = tasks.filter(t => getTaskStatus(t) === 'pending').length;
    const overdueCount = tasks.filter(t => getTaskStatus(t) === 'overdue').length;

    if (isLoading) {
        return (
            <div className="container py-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-background-tertiary rounded w-1/2" />
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
                    <h2 className="text-2xl font-bold">Tasks</h2>
                    <p className="text-foreground-secondary text-sm">
                        {pendingCount} pending{overdueCount > 0 && `, ${overdueCount} overdue`}
                    </p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    <PlusIcon size={20} />
                    Add
                </button>
            </section>

            {/* Filters */}
            <section className="animate-slide-up stagger-1">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                    {(['all', 'pending', 'completed', 'overdue'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'} py-2 px-4 whitespace-nowrap`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </section>

            {/* Tasks List */}
            <section className="space-y-3 animate-slide-up stagger-2">
                {filteredTasks.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center text-3xl">
                            ✅
                        </div>
                        <h3 className="font-semibold mb-2">
                            {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
                        </h3>
                        <p className="text-foreground-muted text-sm mb-4">
                            {filter === 'all' ? 'Add tasks to organize chores' : 'Great job keeping up!'}
                        </p>
                    </div>
                ) : (
                    filteredTasks.map(task => {
                        const status = task.computedStatus;
                        const daysLeft = task.due_date ? getDaysUntil(task.due_date) : null;

                        return (
                            <div
                                key={task.id}
                                className={`glass-card p-4 ${status === 'overdue' ? 'border-danger/50' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Complete Button */}
                                    <button
                                        onClick={() => status !== 'completed' && handleCompleteTask(task.id)}
                                        disabled={status === 'completed'}
                                        className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0
                      ${status === 'completed'
                                                ? 'bg-success/20 text-success'
                                                : 'bg-background-tertiary text-foreground-muted hover:bg-primary/20 hover:text-primary'
                                            }
                    `}
                                    >
                                        {status === 'completed' ? (
                                            <CheckIcon size={20} />
                                        ) : (
                                            <span className="text-xl">{categoryEmojis[task.category || 'other']}</span>
                                        )}
                                    </button>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className={`font-semibold ${status === 'completed' ? 'line-through text-foreground-muted' : ''}`}>
                                                {task.title}
                                            </h4>
                                            {status === 'completed' && <span className="badge badge-success">Done</span>}
                                            {status === 'overdue' && <span className="badge badge-danger">Overdue</span>}
                                            {status === 'pending' && <span className="badge badge-primary">Pending</span>}
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-sm text-foreground-muted">
                                            <span>{getMemberName(task.assigned_to)}</span>

                                            {daysLeft !== null && status !== 'completed' && (
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon size={14} />
                                                    <span>
                                                        {daysLeft === 0
                                                            ? 'Due today'
                                                            : daysLeft < 0
                                                                ? `${Math.abs(daysLeft)} days overdue`
                                                                : `${daysLeft} days left`
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="btn btn-ghost btn-icon text-foreground-muted hover:text-danger"
                                    >
                                        <XIcon size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </section>

            {/* Add Task Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Add Task</h3>
                            <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-icon">
                                <XIcon size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="label">Task Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g., Clean kitchen"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="label">Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(categoryEmojis).map(([cat, emoji]) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNewTask({ ...newTask, category: cat })}
                                            className={`
                        p-2 rounded-xl border transition-all text-center
                        ${newTask.category === cat
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

                            <div>
                                <label className="label">Assign To</label>
                                <select
                                    className="input"
                                    value={newTask.assigned_to}
                                    onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                >
                                    <option value="">Unassigned</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Due Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={newTask.due_date}
                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full">
                                Add Task
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
