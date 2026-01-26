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

            // 1. Create Transaction Record
            const { error: transError } = await supabase
                .from('financial_transactions')
                .insert({
                    reservation_id: reservationId,
                    amount: chargeAmount,
                    type: 'charge',
                    description: description, // e.g. "Room Service: Burger"
                    category: category // e.g. "Food & Beverage"
                });

            if (transError) throw transError;

            // 2. Update Reservation Total Amount
            // We need to fetch the latest total first to be safe, but we passed currentTotal prop.
            //Ideally backend handles this via trigger, but frontend-driven for now:
            const newTotal = currentTotal + chargeAmount;

            const { error: resError } = await supabase
                .from('reservations')
                .update({ total_amount: newTotal })
                .eq('id', reservationId);

            if (resError) throw resError;

            onChargeAdded();
            handleClose();

        } catch (error) {
            console.error("Error adding charge:", error);
            alert("Failed to add charge.");
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
