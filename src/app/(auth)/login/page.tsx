'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { HomeIcon } from '@/components/ui/Icons';

type AuthStep = 'initial' | 'email_password' | 'email_sent';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState<AuthStep>('initial');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        if (isSignUp) {
            // Sign up
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setMessage('Check your email for a confirmation link!');
                setStep('email_sent');
            }
        } else {
            // Sign in
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.push('/');
                router.refresh();
            }
        }

        setIsLoading(false);
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md space-y-8 animate-slide-up relative z-10">
                {/* Logo */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-lg animate-glow">
                        <HomeIcon size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        HouseOps
                    </h1>
                    <p className="text-foreground-secondary mt-2">
                        Shared living, simplified
                    </p>
                </div>

                {/* Initial Step - Choose Auth Method */}
                {step === 'initial' && (
                    <div className="glass-card p-8 space-y-6">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="btn btn-secondary w-full py-4 text-lg"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="divider flex items-center gap-4">
                            <span className="flex-1 h-px bg-glass-border" />
                            <span className="text-foreground-muted text-sm">or</span>
                            <span className="flex-1 h-px bg-glass-border" />
                        </div>

                        <button
                            onClick={() => setStep('email_password')}
                            className="btn btn-primary w-full py-4 text-lg"
                        >
                            Continue with Email
                        </button>
                    </div>
                )}

                {/* Email/Password Step */}
                {step === 'email_password' && (
                    <div className="glass-card p-8 space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold">
                                {isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-foreground-muted text-sm mt-1">
                                {isSignUp ? 'Enter your details to get started' : 'Sign in to continue'}
                            </p>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="label">Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            {error && (
                                <p className="text-danger text-sm text-center">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full py-4"
                            >
                                {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                            </button>
                        </form>

                        <p className="text-center text-sm text-foreground-muted">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-primary ml-1 hover:underline"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>

                        <button
                            onClick={() => setStep('initial')}
                            className="btn btn-ghost w-full text-sm"
                        >
                            ← Back to options
                        </button>
                    </div>
                )}

                {/* Email Sent Confirmation */}
                {step === 'email_sent' && (
                    <div className="glass-card p-8 text-center space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center text-3xl">
                            ✉️
                        </div>
                        <h2 className="text-xl font-semibold">Check Your Email</h2>
                        <p className="text-foreground-muted">
                            We sent a confirmation link to <span className="text-foreground">{email}</span>
                        </p>
                        <button
                            onClick={() => setStep('initial')}
                            className="btn btn-secondary w-full"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
