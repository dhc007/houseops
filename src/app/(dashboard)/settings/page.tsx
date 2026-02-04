'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import {
    ChevronLeftIcon,
    ShareIcon,
    LogOutIcon,
    CopyIcon,
} from '@/components/ui/Icons';
import { useState } from 'react';

export default function SettingsPage() {
    const router = useRouter();
    const { profile, house, member, members, signOut } = useAuth();
    const [copied, setCopied] = useState(false);

    const handleCopyInvite = () => {
        if (house) {
            navigator.clipboard.writeText(house.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <section className="flex items-center gap-4 animate-slide-up">
                <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
                    <ChevronLeftIcon size={24} />
                </button>
                <h1 className="text-2xl font-bold">Settings</h1>
            </section>

            {/* Profile Section */}
            <section className="glass-card p-6 animate-slide-up stagger-1">
                <div className="flex items-center gap-4">
                    <div className="avatar avatar-lg">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full rounded-full" />
                        ) : (
                            getInitials(profile?.name || 'User')
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{profile?.name}</h3>
                        <p className="text-foreground-muted text-sm">
                            {profile?.email || 'No email'}
                        </p>
                    </div>
                </div>
            </section>

            {/* House Section */}
            <section className="animate-slide-up stagger-2">
                <h4 className="text-sm font-medium text-foreground-muted mb-3 px-1 uppercase">House</h4>

                <div className="glass-card divide-y divide-glass-border">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                🏠
                            </div>
                            <div>
                                <p className="font-medium">{house?.name}</p>
                                <p className="text-sm text-foreground-muted">
                                    {members.length} members
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invite Code */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <ShareIcon size={20} className="text-foreground-muted" />
                                <span>Invite Code</span>
                            </div>
                            <span className="font-mono text-primary font-bold">{house?.invite_code}</span>
                        </div>
                        <button
                            onClick={handleCopyInvite}
                            className="btn btn-secondary w-full"
                        >
                            <CopyIcon size={18} />
                            {copied ? 'Copied!' : 'Copy Invite Code'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Members Preview */}
            <section className="animate-slide-up stagger-3">
                <h4 className="text-sm font-medium text-foreground-muted mb-3 px-1 uppercase">Members</h4>

                <div className="glass-card">
                    {members.slice(0, 5).map((m, index) => (
                        <div
                            key={m.id}
                            className={`p-4 flex items-center gap-4 ${index !== Math.min(members.length, 5) - 1 ? 'border-b border-glass-border' : ''
                                }`}
                        >
                            <div className="avatar">
                                {m.avatar_url ? (
                                    <img src={m.avatar_url} alt={m.name} className="w-full h-full rounded-full" />
                                ) : (
                                    getInitials(m.name)
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{m.name}</p>
                                <p className="text-sm text-foreground-muted capitalize">{m.role}</p>
                            </div>
                            {m.role === 'admin' && (
                                <span className="badge badge-primary">Admin</span>
                            )}
                            {!m.has_account && (
                                <span className="badge badge-warning">No account</span>
                            )}
                        </div>
                    ))}
                    {members.length > 5 && (
                        <div className="p-4 text-center">
                            <button onClick={() => router.push('/members')} className="text-primary text-sm">
                                View all {members.length} members
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* App Settings */}
            <section className="animate-slide-up stagger-4">
                <h4 className="text-sm font-medium text-foreground-muted mb-3 px-1 uppercase">App</h4>

                <div className="glass-card divide-y divide-glass-border">
                    <div className="p-4 flex items-center justify-between">
                        <span>Settlement Cycle</span>
                        <span className="text-foreground-muted capitalize">
                            {house?.settlement_cycle || 'Monthly'}
                        </span>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                        <span>Currency</span>
                        <span className="text-foreground-muted">₹ INR</span>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                        <span>Your Role</span>
                        <span className="text-foreground-muted capitalize">{member?.role || 'Member'}</span>
                    </div>
                </div>
            </section>

            {/* Logout */}
            <section className="animate-slide-up">
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary w-full text-danger border-danger/30 hover:bg-danger/10"
                >
                    <LogOutIcon size={20} />
                    Log Out
                </button>
            </section>

            {/* Version */}
            <p className="text-center text-foreground-muted text-sm pt-4">
                HouseOps v1.0.0 • Production
            </p>
        </div>
    );
}
