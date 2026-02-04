'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-provider';
import {
    HomeIcon,
    WalletIcon,
    PackageIcon,
    ChecklistIcon,
    BellIcon,
    UsersIcon,
} from '@/components/ui/Icons';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, profile, house, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (!house && pathname !== '/setup') {
                router.push('/setup');
            }
        }
    }, [isLoading, user, house, pathname, router]);

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-pulse">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-glow" />
                    <p className="text-foreground-secondary">Loading...</p>
                </div>
            </main>
        );
    }

    // Setup page has its own layout
    if (pathname === '/setup') {
        return <>{children}</>;
    }

    // Don't render dashboard layout if no house
    if (!house) {
        return null;
    }

    const navItems = [
        { href: '/dashboard', icon: HomeIcon, label: 'Home' },
        { href: '/expenses', icon: WalletIcon, label: 'Expenses' },
        { href: '/inventory', icon: PackageIcon, label: 'Inventory' },
        { href: '/tasks', icon: ChecklistIcon, label: 'Tasks' },
    ];

    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Header */}
            <header className="sticky top-0 z-50 glass-card border-t-0 border-x-0 rounded-none px-4 py-3">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    {/* House Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <HomeIcon size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg leading-tight">{house.name}</h1>
                            <p className="text-xs text-foreground-muted">Code: {house.invite_code}</p>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <Link href="/members" className="btn btn-ghost btn-icon relative">
                            <UsersIcon size={22} />
                        </Link>
                        <Link href="/notifications" className="btn btn-ghost btn-icon relative">
                            <BellIcon size={22} />
                        </Link>
                        <Link href="/settings" className="avatar">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full rounded-full" />
                            ) : (
                                getInitials(profile?.name || 'User')
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pb-24">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-b-0 border-x-0 rounded-none">
                <div className="flex items-center justify-around max-w-lg mx-auto py-2">
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all
                  ${isActive
                                        ? 'text-primary bg-primary/10'
                                        : 'text-foreground-muted hover:text-foreground'
                                    }
                `}
                            >
                                <Icon size={24} />
                                <span className="text-xs font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
