'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { createClient } from '@/lib/supabase/client';
import type { HouseMember, Room, Visitor } from '@/lib/supabase/types';
import {
    ChevronLeftIcon,
    PlusIcon,
    XIcon,
    UsersIcon,
    ShareIcon,
    CopyIcon,
} from '@/components/ui/Icons';

export default function MembersPage() {
    const router = useRouter();
    const { house, member, members: authMembers, refreshData } = useAuth();
    const supabase = createClient();

    const [members, setMembers] = useState<HouseMember[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddVisitor, setShowAddVisitor] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // New member form
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        phone: '',
        room_id: '',
    });

    // New visitor form
    const [newVisitor, setNewVisitor] = useState({
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        include_in_splits: false,
    });

    useEffect(() => {
        if (house) {
            fetchData();
        }
    }, [house]);

    const fetchData = async () => {
        if (!house) return;

        // Fetch members
        const { data: membersData } = await supabase
            .from('house_members')
            .select('*')
            .eq('house_id', house.id)
            .eq('is_active', true);

        setMembers(membersData || []);

        // Fetch rooms
        const { data: roomsData } = await supabase
            .from('rooms')
            .select('*')
            .eq('house_id', house.id);

        setRooms(roomsData || []);

        // Fetch active visitors
        const today = new Date().toISOString().split('T')[0];
        const { data: visitorsData } = await supabase
            .from('visitors')
            .select('*')
            .eq('house_id', house.id)
            .or(`end_date.is.null,end_date.gte.${today}`);

        setVisitors(visitorsData || []);
    };

    const handleCopyInvite = () => {
        if (house) {
            navigator.clipboard.writeText(house.invite_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!house || !newMember.name.trim()) return;

        setIsLoading(true);

        const { error } = await supabase
            .from('house_members')
            .insert({
                house_id: house.id,
                name: newMember.name.trim(),
                email: newMember.email || null,
                phone: newMember.phone || null,
                room_id: newMember.room_id || null,
                has_account: false,
                role: 'member',
            });

        if (!error) {
            setNewMember({ name: '', email: '', phone: '', room_id: '' });
            setShowAddMember(false);
            fetchData();
            refreshData();
        }

        setIsLoading(false);
    };

    const handleAddVisitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!house || !newVisitor.name.trim()) return;

        setIsLoading(true);

        const { error } = await supabase
            .from('visitors')
            .insert({
                house_id: house.id,
                name: newVisitor.name.trim(),
                invited_by: member?.id,
                start_date: newVisitor.start_date,
                end_date: newVisitor.end_date || null,
                include_in_splits: newVisitor.include_in_splits,
            });

        if (!error) {
            setNewVisitor({
                name: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                include_in_splits: false,
            });
            setShowAddVisitor(false);
            fetchData();
        }

        setIsLoading(false);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Remove this member from the house?')) return;

        await supabase
            .from('house_members')
            .update({ is_active: false })
            .eq('id', memberId);

        fetchData();
        refreshData();
    };

    const handleRemoveVisitor = async (visitorId: string) => {
        await supabase
            .from('visitors')
            .delete()
            .eq('id', visitorId);

        fetchData();
    };

    const handleUpdateMemberRoom = async (memberId: string, roomId: string) => {
        await supabase
            .from('house_members')
            .update({ room_id: roomId || null })
            .eq('id', memberId);

        fetchData();
    };

    const getInitials = (name: string) => {
        return name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    const getRoomName = (roomId: string | null) => {
        if (!roomId) return 'No room';
        return rooms.find(r => r.id === roomId)?.name || 'Unknown';
    };

    const isAdmin = member?.role === 'admin';

    return (
        <div className="container py-6 space-y-6">
            {/* Header */}
            <section className="flex items-center gap-4 animate-slide-up">
                <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
                    <ChevronLeftIcon size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Members</h1>
                    <p className="text-foreground-muted text-sm">{members.length} members</p>
                </div>
            </section>

            {/* Invite Code */}
            <section className="glass-card p-4 animate-slide-up stagger-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShareIcon size={20} className="text-foreground-muted" />
                        <div>
                            <p className="text-sm text-foreground-muted">Invite Code</p>
                            <p className="font-mono text-lg font-bold text-primary">{house?.invite_code}</p>
                        </div>
                    </div>
                    <button onClick={handleCopyInvite} className="btn btn-secondary">
                        <CopyIcon size={18} />
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </section>

            {/* Members List */}
            <section className="animate-slide-up stagger-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground-muted uppercase">Roommates</h3>
                    {isAdmin && (
                        <button onClick={() => setShowAddMember(true)} className="btn btn-ghost text-sm text-primary">
                            <PlusIcon size={18} /> Add
                        </button>
                    )}
                </div>

                <div className="glass-card divide-y divide-glass-border">
                    {members.map(m => (
                        <div key={m.id} className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="avatar">
                                    {m.avatar_url ? (
                                        <img src={m.avatar_url} alt={m.name} />
                                    ) : (
                                        getInitials(m.name)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium truncate">{m.name}</h4>
                                        {m.role === 'admin' && <span className="badge badge-primary text-xs">Admin</span>}
                                        {!m.has_account && <span className="badge badge-warning text-xs">No account</span>}
                                    </div>
                                    <p className="text-sm text-foreground-muted">{getRoomName(m.room_id)}</p>
                                </div>

                                {isAdmin && m.id !== member?.id && (
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={m.room_id || ''}
                                            onChange={(e) => handleUpdateMemberRoom(m.id, e.target.value)}
                                            className="input py-1 px-2 text-sm w-24"
                                        >
                                            <option value="">No room</option>
                                            {rooms.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="btn btn-ghost btn-icon text-danger"
                                        >
                                            <XIcon size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Visitors Section */}
            <section className="animate-slide-up stagger-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground-muted uppercase">Visitors / Guests</h3>
                    <button onClick={() => setShowAddVisitor(true)} className="btn btn-ghost text-sm text-primary">
                        <PlusIcon size={18} /> Add
                    </button>
                </div>

                {visitors.length === 0 ? (
                    <div className="glass-card p-6 text-center">
                        <p className="text-foreground-muted">No active visitors</p>
                    </div>
                ) : (
                    <div className="glass-card divide-y divide-glass-border">
                        {visitors.map(v => (
                            <div key={v.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-lg">
                                        👤
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">{v.name}</h4>
                                        <p className="text-sm text-foreground-muted">
                                            {new Date(v.start_date).toLocaleDateString()}
                                            {v.end_date ? ` - ${new Date(v.end_date).toLocaleDateString()}` : ' (ongoing)'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {v.include_in_splits && (
                                            <span className="badge badge-success text-xs">In splits</span>
                                        )}
                                        <button
                                            onClick={() => handleRemoveVisitor(v.id)}
                                            className="btn btn-ghost btn-icon text-danger"
                                        >
                                            <XIcon size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Add Roommate</h3>
                            <button onClick={() => setShowAddMember(false)} className="btn btn-ghost btn-icon">
                                <XIcon size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="label">Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Full name"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="label">Email (optional)</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="email@example.com"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Phone (optional)</label>
                                <input
                                    type="tel"
                                    className="input"
                                    placeholder="+91 9876543210"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Room</label>
                                <select
                                    className="input"
                                    value={newMember.room_id}
                                    onChange={(e) => setNewMember({ ...newMember, room_id: e.target.value })}
                                >
                                    <option value="">No room assigned</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <p className="text-sm text-foreground-muted">
                                💡 This adds a roommate without an account. They can join later with the invite code.
                            </p>

                            <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                                {isLoading ? 'Adding...' : 'Add Roommate'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Visitor Modal */}
            {showAddVisitor && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50">
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Add Visitor</h3>
                            <button onClick={() => setShowAddVisitor(false)} className="btn btn-ghost btn-icon">
                                <XIcon size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddVisitor} className="space-y-4">
                            <div>
                                <label className="label">Guest Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Who's visiting?"
                                    value={newVisitor.name}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">From</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={newVisitor.start_date}
                                        onChange={(e) => setNewVisitor({ ...newVisitor, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">To (optional)</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={newVisitor.end_date}
                                        onChange={(e) => setNewVisitor({ ...newVisitor, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newVisitor.include_in_splits}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, include_in_splits: e.target.checked })}
                                    className="w-5 h-5 rounded accent-primary"
                                />
                                <div>
                                    <p className="font-medium">Include in expense splits</p>
                                    <p className="text-sm text-foreground-muted">Add them to shared groceries, etc.</p>
                                </div>
                            </label>

                            <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                                {isLoading ? 'Adding...' : 'Add Visitor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
