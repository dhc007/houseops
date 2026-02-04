'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { createClient } from '@/lib/supabase/client';
import {
    HomeIcon,
    UsersIcon,
    WalletIcon,
    CheckIcon,
    ChevronRightIcon,
    ChevronLeftIcon
} from '@/components/ui/Icons';

type SetupStep = 'choice' | 'create_name' | 'create_rent' | 'create_rooms' | 'join' | 'complete';

// Generate a random 6-character invite code
function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default function SetupPage() {
    const router = useRouter();
    const { user, profile, refreshData } = useAuth();
    const supabase = createClient();

    const [step, setStep] = useState<SetupStep>('choice');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // House creation data
    const [houseName, setHouseName] = useState('');
    const [rentAmount, setRentAmount] = useState('');
    const [rooms, setRooms] = useState<string[]>(['Room 1']);

    // Join house data
    const [inviteCode, setInviteCode] = useState('');

    const steps: SetupStep[] = ['choice', 'create_name', 'create_rent', 'create_rooms', 'complete'];
    const currentStepIndex = steps.indexOf(step);

    const handleCreateHouse = async () => {
        if (!user || !profile) return;
        setIsLoading(true);
        setError('');

        try {
            const code = generateInviteCode();

            // Create the house
            const { data: house, error: houseError } = await supabase
                .from('houses')
                .insert({
                    name: houseName,
                    rent_amount: parseFloat(rentAmount) || 0,
                    invite_code: code,
                    created_by: user.id,
                })
                .select()
                .single();

            if (houseError) throw houseError;

            // Create rooms
            if (rooms.length > 0) {
                const roomInserts = rooms.filter(r => r.trim()).map(name => ({
                    house_id: house.id,
                    name: name.trim(),
                }));

                if (roomInserts.length > 0) {
                    await supabase.from('rooms').insert(roomInserts);
                }
            }

            // Add current user as admin member
            const { error: memberError } = await supabase
                .from('house_members')
                .insert({
                    house_id: house.id,
                    user_id: user.id,
                    name: profile.name,
                    email: profile.email,
                    avatar_url: profile.avatar_url,
                    role: 'admin',
                    has_account: true,
                });

            if (memberError) throw memberError;

            // Refresh auth data and redirect
            await refreshData();
            setStep('complete');

            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to create house');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinHouse = async () => {
        if (!user || !profile) return;
        setIsLoading(true);
        setError('');

        try {
            // Find house by invite code
            const { data: house, error: houseError } = await supabase
                .from('houses')
                .select('*')
                .eq('invite_code', inviteCode.toUpperCase())
                .single();

            if (houseError || !house) {
                throw new Error('Invalid invite code. Please check and try again.');
            }

            // Check if already a member
            const { data: existingMember } = await supabase
                .from('house_members')
                .select('id')
                .eq('house_id', house.id)
                .eq('user_id', user.id)
                .single();

            if (existingMember) {
                throw new Error('You are already a member of this house.');
            }

            // Add user as member
            const { error: memberError } = await supabase
                .from('house_members')
                .insert({
                    house_id: house.id,
                    user_id: user.id,
                    name: profile.name,
                    email: profile.email,
                    avatar_url: profile.avatar_url,
                    role: 'member',
                    has_account: true,
                });

            if (memberError) throw memberError;

            // Refresh and redirect
            await refreshData();
            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message || 'Failed to join house');
        } finally {
            setIsLoading(false);
        }
    };

    const addRoom = () => {
        setRooms([...rooms, `Room ${rooms.length + 1}`]);
    };

    const updateRoom = (index: number, value: string) => {
        const newRooms = [...rooms];
        newRooms[index] = value;
        setRooms(newRooms);
    };

    const removeRoom = (index: number) => {
        if (rooms.length > 1) {
            setRooms(rooms.filter((_, i) => i !== index));
        }
    };

    return (
        <main className="min-h-screen flex flex-col p-4">
            {/* Progress Bar */}
            {step !== 'choice' && step !== 'join' && (
                <div className="w-full max-w-md mx-auto mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {['create_name', 'create_rent', 'create_rooms'].map((s, i) => (
                            <div
                                key={s}
                                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStepIndex > i + 1 ? 'bg-success text-white' :
                                        currentStepIndex === i + 1 ? 'bg-primary text-white' :
                                            'bg-background-tertiary text-foreground-muted'}
                `}
                            >
                                {currentStepIndex > i + 1 ? <CheckIcon size={16} /> : i + 1}
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-background-tertiary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${((currentStepIndex - 1) / 3) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-md">

                    {/* Choice: Create or Join */}
                    {step === 'choice' && (
                        <div className="space-y-8 animate-slide-up">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
                                    <HomeIcon size={40} className="text-white" />
                                </div>
                                <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.name?.split(' ')[0]}!</h1>
                                <p className="text-foreground-secondary">
                                    Let&apos;s get you set up with your shared home
                                </p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setStep('create_name')}
                                    className="glass-card p-6 w-full text-left hover:border-primary/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                                            🏠
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">Create a New House</h3>
                                            <p className="text-sm text-foreground-muted">Set up a new shared space</p>
                                        </div>
                                        <ChevronRightIcon className="text-foreground-muted group-hover:text-primary transition-colors" />
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStep('join')}
                                    className="glass-card p-6 w-full text-left hover:border-primary/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center text-2xl">
                                            🔗
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">Join Existing House</h3>
                                            <p className="text-sm text-foreground-muted">I have an invite code</p>
                                        </div>
                                        <ChevronRightIcon className="text-foreground-muted group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Join House */}
                    {step === 'join' && (
                        <div className="space-y-6 animate-slide-up">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-success/20 flex items-center justify-center text-3xl mb-4">
                                    🔗
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Join a House</h2>
                                <p className="text-foreground-secondary">
                                    Enter the 6-character invite code
                                </p>
                            </div>

                            <div className="glass-card p-6">
                                <input
                                    type="text"
                                    className="input text-center text-2xl font-mono tracking-widest uppercase"
                                    placeholder="ABC123"
                                    maxLength={6}
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <p className="text-danger text-center text-sm">{error}</p>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep('choice')} className="btn btn-secondary flex-1">
                                    <ChevronLeftIcon size={20} /> Back
                                </button>
                                <button
                                    onClick={handleJoinHouse}
                                    disabled={inviteCode.length !== 6 || isLoading}
                                    className="btn btn-primary flex-1"
                                >
                                    {isLoading ? 'Joining...' : 'Join House'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Create: House Name */}
                    {step === 'create_name' && (
                        <div className="space-y-6 animate-slide-up">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center text-3xl mb-4">
                                    🏠
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Name Your House</h2>
                                <p className="text-foreground-secondary">
                                    Give your shared home a memorable name
                                </p>
                            </div>

                            <div className="glass-card p-6">
                                <input
                                    type="text"
                                    className="input text-center text-xl"
                                    placeholder="e.g., The Pad, Casa Awesome"
                                    value={houseName}
                                    onChange={(e) => setHouseName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep('choice')} className="btn btn-secondary">
                                    <ChevronLeftIcon size={20} />
                                </button>
                                <button
                                    onClick={() => setStep('create_rent')}
                                    disabled={!houseName.trim()}
                                    className="btn btn-primary flex-1"
                                >
                                    Next <ChevronRightIcon size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Create: Monthly Rent */}
                    {step === 'create_rent' && (
                        <div className="space-y-6 animate-slide-up">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center text-3xl mb-4">
                                    💰
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Monthly Rent</h2>
                                <p className="text-foreground-secondary">
                                    What&apos;s the total rent? (optional)
                                </p>
                            </div>

                            <div className="glass-card p-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl text-foreground-muted">₹</span>
                                    <input
                                        type="number"
                                        className="input text-center text-2xl flex-1"
                                        placeholder="25000"
                                        value={rentAmount}
                                        onChange={(e) => setRentAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep('create_name')} className="btn btn-secondary">
                                    <ChevronLeftIcon size={20} />
                                </button>
                                <button
                                    onClick={() => setStep('create_rooms')}
                                    className="btn btn-primary flex-1"
                                >
                                    Next <ChevronRightIcon size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Create: Rooms */}
                    {step === 'create_rooms' && (
                        <div className="space-y-6 animate-slide-up">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center text-3xl mb-4">
                                    🚪
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Add Rooms</h2>
                                <p className="text-foreground-secondary">
                                    Name the rooms in your house
                                </p>
                            </div>

                            <div className="glass-card p-4 space-y-3 max-h-64 overflow-y-auto">
                                {rooms.map((room, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            className="input flex-1"
                                            placeholder={`Room ${index + 1}`}
                                            value={room}
                                            onChange={(e) => updateRoom(index, e.target.value)}
                                        />
                                        {rooms.length > 1 && (
                                            <button
                                                onClick={() => removeRoom(index)}
                                                className="btn btn-ghost btn-icon text-danger"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addRoom} className="btn btn-secondary w-full text-sm">
                                    + Add Room
                                </button>
                            </div>

                            {error && (
                                <p className="text-danger text-center text-sm">{error}</p>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep('create_rent')} className="btn btn-secondary">
                                    <ChevronLeftIcon size={20} />
                                </button>
                                <button
                                    onClick={handleCreateHouse}
                                    disabled={isLoading}
                                    className="btn btn-primary flex-1"
                                >
                                    {isLoading ? 'Creating...' : 'Create House 🎉'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Complete */}
                    {step === 'complete' && (
                        <div className="text-center space-y-6 animate-slide-up">
                            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                                <CheckIcon size={40} className="text-success" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">You&apos;re All Set!</h2>
                                <p className="text-foreground-secondary">
                                    {houseName} is ready. Redirecting to dashboard...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
