import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign, CheckCircle, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './UIComponents';
import { useAuth } from '../context/AuthContext';

interface ExpenseItem {
    id: string;
    item: string;
    cost: number;
}

interface ResolveMaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticketId?: string;
    roomId?: string; // If provided, looks up the open ticket for this room
    onSuccess: () => void;
}

const ResolveMaintenanceModal: React.FC<ResolveMaintenanceModalProps> = ({
    isOpen, onClose, ticketId, roomId, onSuccess
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingTicket, setFetchingTicket] = useState(false);
    const [activeTicketId, setActiveTicketId] = useState<string | null>(ticketId || null);

    // Form State
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [expenses, setExpenses] = useState<ExpenseItem[]>([
        { id: '1', item: '', cost: 0 }
    ]);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setResolutionNotes('');
            setExpenses([{ id: Date.now().toString(), item: '', cost: 0 }]);

            if (roomId && !ticketId) {
                fetchActiveTicketForRoom(roomId);
            } else {
                setActiveTicketId(ticketId || null);
            }
        }
    }, [isOpen, roomId, ticketId]);

    const fetchActiveTicketForRoom = async (rid: string) => {
        setFetchingTicket(true);
        try {
            const { data, error: _error } = await supabase
                .from('maintenance')
                .select('id')
                .eq('room_id', rid)
                .neq('status', 'Resolved')
                .limit(1)
                .maybeSingle();

            if (data) {
                setActiveTicketId(data.id);
            } else {
                setActiveTicketId(null);
            }
        } catch (err) {
            console.error("Error fetching ticket:", err);
        } finally {
            setFetchingTicket(false);
        }
    };

    const handleAddExpense = () => {
        setExpenses([...expenses, { id: Date.now().toString(), item: '', cost: 0 }]);
    };

    const handleRemoveExpense = (id: string) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const updateExpense = (id: string, field: 'item' | 'cost', value: string | number) => {
        setExpenses(expenses.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const totalCost = expenses.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!activeTicketId) {
            alert("No active maintenance ticket found for this room.");
            return;
        }

        if (!user?.propertyId) {
            alert("Error: Property ID missing. Please refresh functionality.");
            return;
        }

        setLoading(true);

        try {
            // 1. Update Ticket & Get Room ID
            const { data: ticketData, error: ticketError } = await supabase
                .from('maintenance')
                .update({
                    status: 'Resolved',
                    resolution_notes: resolutionNotes,
                    expenses: expenses.filter(e => e.item.trim() !== ''), // Clean empty rows
                    total_cost: totalCost
                })
                .eq('id', activeTicketId)
                .select('room_id')
                .single();

            if (ticketError) throw ticketError;

            // 2. Update Room Status (Use prop OR fetched ID)
            const targetRoomId = roomId || ticketData?.room_id;

            if (targetRoomId) {
                await supabase
                    .from('rooms')
                    .update({ status: 'Clean' }) // Set to Clean/Available upon fix
                    .eq('id', targetRoomId);
            }

            // 3. Record Expense in Financial Ledger
            if (activeTicketId && totalCost > 0) {
                console.log("[ResolveMaintenance] Inserting financial transaction:", {
                    totalCost,
                    user: user?.id,
                    property: user?.propertyId
                });

                const { error: financeError } = await supabase
                    .from('financial_transactions')
                    .insert({
                        type: 'Expense',
                        category: 'Maintenance',
                        amount: totalCost,
                        description: `Maintenance Fix: ${resolutionNotes.substring(0, 50)}...`,
                        created_by: user?.id, // Supabase will error if this is invalid UUID, ensure it's not undefined
                        property_id: user.propertyId,
                        processed_at: new Date().toISOString()
                    });

                if (financeError) {
                    console.error("Failed to record expense:", financeError);
                    alert(`Maintenance resolved, but failed to record expense: ${financeError.message}`);
                    // Don't throw, let the resolution succeed at least
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error resolving ticket:", error);
            alert(`Failed to save resolution details: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-green-50/50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Resolve Issue
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {fetchingTicket ? (
                    <div className="p-8 text-center text-slate-500">Checking for active tickets...</div>
                ) : !activeTicketId && roomId ? (
                    <div className="p-8 text-center">
                        <p className="text-slate-600 mb-4">No open maintenance tickets found for this room.</p>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Resolution Notes */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Resolution Details</label>
                            <textarea
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm min-h-[100px]"
                                placeholder="Describe what was fixed..."
                                value={resolutionNotes}
                                onChange={e => setResolutionNotes(e.target.value)}
                                required
                            />
                        </div>

                        {/* Itemized Expenses */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-slate-400" /> Itemized Costs
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddExpense}
                                    className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Item
                                </button>
                            </div>

                            <div className="space-y-2">
                                {expenses.map((expense) => (
                                    <div key={expense.id} className="flex gap-2 items-start">
                                        <input
                                            placeholder="Item (e.g. New Faucet)"
                                            className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors outline-none focus:border-blue-400"
                                            value={expense.item}
                                            onChange={e => updateExpense(expense.id, 'item', e.target.value)}
                                        />
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full p-2 pl-5 border border-slate-200 rounded-lg text-sm text-right outline-none focus:border-blue-400"
                                                value={expense.cost}
                                                onChange={e => updateExpense(expense.id, 'cost', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        {expenses.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExpense(expense.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Calculator className="w-4 h-4" />
                                <span className="text-sm font-medium">Total Cost</span>
                            </div>
                            <span className="text-xl font-bold text-slate-900">${totalCost.toFixed(2)}</span>
                        </div>

                    </form>
                )}

                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !activeTicketId}
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                    >
                        {loading ? 'Saving...' : 'Mark Fixed'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ResolveMaintenanceModal;
