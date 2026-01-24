import React, { useEffect, useState } from 'react';
import { X, User, CreditCard, Calendar, Phone, Mail, DollarSign, Clock, BedDouble } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Badge, Button } from './UIComponents';
import { Room } from '../types';

interface RoomDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room;
}

interface ReservationDetails {
    id: string;
    guest_id: string;
    check_in: string;
    check_out: string;
    status: string;
    total_amount: number;
    notes?: string;
    guest?: {
        full_name: string;
        email: string;
        phone: string;
        vip_status?: boolean;
    };
}

interface Transaction {
    id: string;
    amount: number;
    type: 'payment' | 'charge' | 'refund';
    description: string;
    created_at: string;
}

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({ isOpen, onClose, room }) => {
    const [loading, setLoading] = useState(true);
    const [reservation, setReservation] = useState<ReservationDetails | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (isOpen && room) {
            fetchRoomDetails();
        }
    }, [isOpen, room]);

    const fetchRoomDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Active Reservation (Checked In or Confirmed overlapping today)
            console.log("DEBUG: Fetching details for room", room.id);
            const today = new Date().toISOString().split('T')[0];

            // Fetch ALL active-status reservations for this room to handle overlaps/dates in JS
            const { data: reservations, error: resError } = await supabase
                .from('reservations')
                .select(`
                    *,
                    guest:guests (
                        full_name,
                        email,
                        phone,
                        vip_status
                    )
                `)
                .eq('room_id', room.id)
                .in('status', ['Checked In', 'Confirmed']);

            if (resError) throw resError;

            console.log("DEBUG: Raw reservations found:", reservations);

            // Filter for effective dates in JS (Active today)
            // Logic: Check-in is today or before, Check-out is TODAY or after.
            // Note: If you check out today, you are still "in" the system until actual check out,
            // but status usually updates to Checked Out.
            // We filtered status above, so effectively this finds who is physically supposed to be there.
            const activeRes = reservations?.filter(r => r.check_in <= today && r.check_out >= today);

            // Sort by check_in descending to prioritize the latest one (e.g. today's check-in over yesterday's lingering stay)
            activeRes?.sort((a, b) => b.check_in.localeCompare(a.check_in));

            const resData = activeRes && activeRes.length > 0 ? activeRes[0] : null;
            console.log("DEBUG: Selected Active Reservation:", resData);



            if (resData) {
                setReservation(resData);

                // 2. Fetch Transactions for this reservation
                const { data: transData, error: transError } = await supabase
                    .from('financial_transactions')
                    .select('*')
                    .eq('reservation_id', resData.id)
                    .order('created_at', { ascending: false });

                if (transError) throw transError;
                setTransactions(transData || []);
            } else {
                setReservation(null);
                setTransactions([]);
            }

        } catch (error) {
            console.error("Error fetching room details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const calculateBalance = () => {
        if (!reservation) return 0;
        const totalCharges = reservation.total_amount || 0;
        const totalPaid = transactions
            .filter(t => t.type === 'payment')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        return totalCharges - totalPaid;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-slate-900 p-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white">Room {room.number}</h2>
                            <Badge color={room.status === 'Clean' ? 'green' : room.status === 'Dirty' ? 'red' : 'yellow'}>
                                {room.status}
                            </Badge>
                        </div>
                        <p className="text-slate-400 mt-1">{room.type}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center text-slate-500">
                            <div className="animate-spin mb-3"><Clock className="w-8 h-8 text-blue-500" /></div>
                            <p>Loading details...</p>
                        </div>
                    ) : reservation ? (
                        <div className="space-y-8">
                            {/* Guest Section */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-500" />
                                    Current Guest
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xl font-bold text-slate-900">{reservation.guest?.full_name || 'Unknown Guest'}</p>
                                        {reservation.guest?.vip_status && (
                                            <span className="inline-block px-2 py-0.5 bg-gold-100 text-gold-700 text-xs font-bold rounded mt-1">VIP MEMBER</span>
                                        )}
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{reservation.guest?.email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <span>{reservation.guest?.phone || 'No phone'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reservation Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border border-slate-200 rounded-xl">
                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Check In</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <p className="font-semibold text-slate-900">{reservation.check_in}</p>
                                    </div>
                                </div>
                                <div className="p-4 border border-slate-200 rounded-xl">
                                    <p className="text-xs font-medium text-slate-500 uppercase mb-1">Check Out</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <p className="font-semibold text-slate-900">{reservation.check_out}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financials */}
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-emerald-500" />
                                    Financials
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <p className="text-xs text-slate-500">Total Charges</p>
                                        <p className="text-lg font-bold text-slate-900">${reservation.total_amount}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-lg">
                                        <p className="text-xs text-emerald-600">Paid</p>
                                        <p className="text-lg font-bold text-emerald-700">
                                            ${transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + Number(t.amount), 0)}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${calculateBalance() > 0 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                        <p className={`text-xs ${calculateBalance() > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Balance Due</p>
                                        <p className={`text-lg font-bold ${calculateBalance() > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                                            ${calculateBalance().toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2 font-medium text-slate-500">Date</th>
                                                <th className="px-4 py-2 font-medium text-slate-500">Description</th>
                                                <th className="px-4 py-2 font-medium text-slate-500 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {transactions.length > 0 ? transactions.map(t => (
                                                <tr key={t.id}>
                                                    <td className="px-4 py-2 text-slate-600">
                                                        {new Date(t.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-900">{t.description}</td>
                                                    <td className={`px-4 py-2 font-medium text-right ${t.type === 'payment' ? 'text-emerald-600' : 'text-slate-900'
                                                        }`}>
                                                        {t.type === 'payment' ? '-' : ''}${t.amount}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                                                        No transactions found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <BedDouble className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Room is Vacant</h3>
                            <p className="text-slate-500 mt-2 max-w-sm">
                                There are no active reservations associated with this room for today.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    {reservation && <Button>View Full Reservation</Button>}
                </div>
            </div>
        </div>
    );
};

export default RoomDetailsModal;
