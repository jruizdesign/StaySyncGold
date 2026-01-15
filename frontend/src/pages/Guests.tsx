import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Badge, Select } from '../components/UIComponents';
import { Users, MessageSquare, Ban, FileText, Plus, Receipt, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Guest } from '../types';

const Guests: React.FC = () => {
    const { user } = useAuth();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [notes, setNotes] = useState('');
    const [activeSubTab, setActiveSubTab] = useState<'profile' | 'billing'>('profile');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) {
            fetchGuests();
        }
    }, [user]);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            let query = supabase.from('guests').select('*');

            if (user?.propertyId) {
                query = query.eq('property_id', user.propertyId);
            } else if (user?.email !== 'jason@staysync.com') {
                setGuests([]);
                setLoading(false);
                return;
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const mappedGuests: Guest[] = data.map((g: any) => ({
                    id: g.id,
                    fullName: `${g.first_name} ${g.last_name}`,
                    email: g.email || '',
                    phone: g.phone || '',
                    vipStatus: g.vip_status || false,
                    notes: g.notes || '',
                    lastStay: g.last_stay // Optional in interface
                }));
                setGuests(mappedGuests);
            }
        } catch (error) {
            console.error('Error fetching guests:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredGuests = guests.filter(g =>
        g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone.includes(searchTerm)
    );

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-gold-500" /></div>;
    }

    if (!user?.propertyId && user?.email !== 'jason@staysync.com') {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <p>You are not assigned to any property.</p>
                <p className="text-sm">Please contact your administrator.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Guest CRM</h1>
                <Button icon={Plus}>Add New Guest</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1" title="Guest Directory">
                    <div className="space-y-3">
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                            {filteredGuests.map(guest => (
                                <div
                                    key={guest.id}
                                    onClick={() => {
                                        setSelectedGuest(guest);
                                        setNotes(guest.notes);
                                    }}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedGuest?.id === guest.id ? 'border-gold-500 bg-gold-50' : 'border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-slate-900">{guest.fullName}</p>
                                        {/* guest.vipStatus && <Badge color="gold">VIP</Badge> */}
                                        {/* Example specific logic if needed */}
                                    </div>
                                    <p className="text-xs text-slate-500">{guest.email}</p>
                                </div>
                            ))}
                            {filteredGuests.length === 0 && (
                                <p className="text-center text-slate-400 py-4">No guests found.</p>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2" title={selectedGuest ? `Guest: ${selectedGuest.fullName}` : 'Select a Guest'}>
                    {selectedGuest ? (
                        <div className="space-y-6">
                            <div className="flex border-b border-slate-100">
                                <button onClick={() => setActiveSubTab('profile')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'profile' ? 'border-gold-500 text-gold-600' : 'border-transparent text-slate-500'}`}>Profile & Notes</button>
                                <button onClick={() => setActiveSubTab('billing')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'billing' ? 'border-gold-500 text-gold-600' : 'border-transparent text-slate-500'}`}>Billing & Invoices</button>
                            </div>

                            {activeSubTab === 'profile' ? (
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label="Email" defaultValue={selectedGuest.email} readOnly /> {/* ReadOnly for now until edit implemented */}
                                                <Input label="Phone" defaultValue={selectedGuest.phone} readOnly />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
                                                <textarea
                                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                                                    rows={6}
                                                    placeholder="Add private notes about this guest (e.g., preferences, past issues)..."
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-48 space-y-4">
                                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                                <div className="flex items-center gap-2 text-red-700 mb-2">
                                                    <Ban className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase">Restriction</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" className="rounded text-red-600" defaultChecked={false} />
                                                    <span className="text-sm text-red-900">Do Not Rent</span>
                                                </label>
                                            </div>
                                            <Button variant="outline" icon={MessageSquare} className="w-full">AI Messaging</Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setSelectedGuest(null)}>Close</Button>
                                        <Button>Save Profile</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-slate-800">Invoice History</h4>
                                        <Button size="sm" icon={Plus}>Generate Invoice</Button>
                                    </div>
                                    <div className="border border-slate-100 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                                <tr>
                                                    <th className="px-4 py-2">Date</th>
                                                    <th className="px-4 py-2">Amount</th>
                                                    <th className="px-4 py-2">Status</th>
                                                    <th className="px-4 py-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {/* Placeholder invoices */}
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-3 text-center text-slate-400">No invoices found.</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                            <Users className="w-16 h-16 mb-4 opacity-10" />
                            <p>Select a guest to manage their profile and billing</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Guests;