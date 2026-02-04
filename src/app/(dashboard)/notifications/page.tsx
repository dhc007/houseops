'use client';

import { useStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import {
    ChevronLeftIcon,
    CheckIcon,
} from '@/components/ui/Icons';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();
    const { state, dispatch } = useStore();

    const handleMarkRead = (id: string) => {
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    };

    const handleMarkAllRead = () => {
        state.notifications.forEach(n => {
            if (!n.read) {
                dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id });
            }
        });
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'expense': return '💸';
            case 'inventory': return '📦';
            case 'task': return '✅';
            case 'settlement': return '💰';
            case 'reminder': return '⏰';
            default: return '🔔';
        }
    };

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <section className="flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
                        <ChevronLeftIcon size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                </div>

                {state.notifications.some(n => !n.read) && (
                    <button onClick={handleMarkAllRead} className="btn btn-ghost text-sm">
                        Mark all read
                    </button>
                )}
            </section>

            {/* Notifications List */}
            <section className="space-y-3 animate-slide-up stagger-1">
                {state.notifications.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-tertiary flex items-center justify-center text-3xl">
                            🔔
                        </div>
                        <h3 className="font-semibold mb-2">No notifications</h3>
                        <p className="text-foreground-muted text-sm">
                            You&apos;re all caught up!
                        </p>
                    </div>
                ) : (
                    state.notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`glass-card p-4 flex items-start gap-4 ${!notification.read ? 'border-primary/30' : ''
                                }`}
                            onClick={() => !notification.read && handleMarkRead(notification.id)}
                        >
                            <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center text-xl">
                                {getNotificationIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className={`font-medium ${!notification.read ? '' : 'text-foreground-secondary'}`}>
                                        {notification.title}
                                    </h4>
                                    {!notification.read && (
                                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                    )}
                                </div>
                                <p className="text-sm text-foreground-muted mt-1">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-foreground-muted mt-2">
                                    {formatRelativeTime(notification.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}
