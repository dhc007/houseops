'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';

export default function Home() {
  const router = useRouter();
  const { user, house, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!house) {
        router.push('/setup');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isLoading, user, house, router]);

  // Loading state
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-glow" />
        <p className="text-foreground-secondary">Loading...</p>
      </div>
    </main>
  );
}
