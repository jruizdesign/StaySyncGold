import React, { useState } from 'react';
import { Modal, Button, Input, Select } from './UIComponents';
import { useAuth } from '../context/AuthContext';
import { BadgeDollarSign } from 'lucide-react';

interface AddChargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservationId: string;
    currentTotal: number;
    onChargeAdded: () => void;
}

const AddChargeModal: React.FC<AddChargeModalProps> = ({ isOpen, onClose, reservationId, currentTotal, onChargeAdded }) => {
    const { session } = useAuth();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Service');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !description) return;
        if (!session) {
            console.error("No session found");
            return;
        }

        setLoading(true);
        try {
            const chargeAmount = parseFloat(amount);

            const response = await fetch(`/api/reservations/${reservationId}/charges`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    amount: chargeAmount,
                    description: description,
                    category: category,
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
