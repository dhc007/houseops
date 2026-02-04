'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import type { Profile, House, HouseMember } from '@/lib/supabase/types';

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    house: House | null;
    member: HouseMember | null;
    members: HouseMember[];
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [house, setHouse] = useState<House | null>(null);
    const [member, setMember] = useState<HouseMember | null>(null);
    const [members, setMembers] = useState<HouseMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    const fetchUserData = async (userId: string) => {
        // Get profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        setProfile(profileData);

        // Get user's house membership
        const { data: memberData } = await supabase
            .from('house_members')
            .select('*, houses(*)')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (memberData) {
            setMember(memberData);
            setHouse(memberData.houses as unknown as House);

            // Get all house members
            const { data: allMembers } = await supabase
                .from('house_members')
                .select('*')
                .eq('house_id', memberData.house_id)
                .eq('is_active', true);

            setMembers(allMembers || []);
        }
    };

    const refreshData = async () => {
        if (user) {
            await fetchUserData(user.id);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setHouse(null);
        setMember(null);
        setMembers([]);
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserData(session.user.id);
            }
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchUserData(session.user.id);
                } else {
                    setProfile(null);
                    setHouse(null);
                    setMember(null);
                    setMembers([]);
                }
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            house,
            member,
            members,
            isLoading,
            signOut,
            refreshData,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
