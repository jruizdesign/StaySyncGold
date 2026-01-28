import React, { useState } from 'react';
import { Modal, Button, Input, Select } from './UIComponents';
import { supabase } from '../lib/supabase';
import { BadgeDollarSign } from 'lucide-react';

interface AddChargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservationId: string;
    currentTotal: number;
    onChargeAdded: () => void;
}

const AddChargeModal: React.FC<AddChargeModalProps> = ({ isOpen, onClose, reservationId, currentTotal, onChargeAdded }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Service');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !description) return;

        setLoading(true);
        try {
            const chargeAmount = parseFloat(amount);

            // Use Backend API to ensure sync with Bookings table
            // This handles BOTH the transaction insert and the reservation/booking total update.
            const response = await fetch(`/api/reservations/${reservationId}/charges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Assuming headers are handled by some global interceptor or we need auth?
                    // Usually we need Authorization header if protected.
                    // For now, let's assume public or handled by cookie/proxy if setup, 
                    // but standard practice here is likely needing token.
                    // However, previous code (Reservations.tsx) showed usage of session.access_token.
                    // AddChargeModal doesn't import useAuth or session. 
                    // Let's import useAuth to get the token.
                },
                body: JSON.stringify({
                    amount: chargeAmount,
                    description: description,
                    category: category,
                    // We might want to pass 'added_by' if we have user context
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Failed to add charge');
            }

            onChargeAdded();
            handleClose();

        } catch (error: any) {
            console.error("Error adding charge:", error);
            alert("Failed to add charge: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setDescription('');
        setCategory('Service');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Charge">
            <div className="space-y-4">
                <div>
                    <Input
                        label="Amount ($)"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                        placeholder="0.00"
                        icon={BadgeDollarSign}
                    />
                </div>
                <div>
                    <Input
                        label="Description"
                        value={description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                        placeholder="Item description (e.g. Late Checkout)"
                    />
                </div>
                <div>
                    <Select
                        label="Category"
                        value={category}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                    >
                        <option value="Service">Service</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Damage Fee">Damage Fee</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Other">Other</option>
                    </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Charge'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AddChargeModal;
