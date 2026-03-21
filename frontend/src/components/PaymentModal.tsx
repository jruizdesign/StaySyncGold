import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Modal, Button, Input } from './UIComponents';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample');

interface CheckoutFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // If you have a specific success URL, you can put it here.
                // Otherwise it will use the default behavior.
            },
            redirect: 'if_required'
        });

        if (error) {
            setMessage(error.message || 'An unexpected error occurred.');
            setIsProcessing(false);
        } else {
            setMessage('Payment successful!');
            setIsProcessing(false);
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {message && <div className="text-sm text-red-500 mt-2">{message}</div>}

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel} type="button" disabled={isProcessing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isProcessing || !stripe || !elements}>
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                </Button>
            </div>
        </form>
    );
};

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    reservationId?: string;
    defaultAmount: number;
    guestName?: string;
    onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    propertyId,
    reservationId,
    defaultAmount,
    guestName,
    onPaymentSuccess
}) => {
    const { session } = useAuth();
    const [clientSecret, setClientSecret] = useState('');
    const [amount, setAmount] = useState(defaultAmount.toString());
    const [step, setStep] = useState<'amount' | 'checkout'>('amount');
    const [method, setMethod] = useState<'card' | 'cash' | 'check' | 'transfer' | 'other'>('card');
    const [notes, setNotes] = useState('');
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('amount');
            setClientSecret('');
            setAmount(defaultAmount.toString());
            setMethod('card');
            setNotes('');
        }
    }, [isOpen, defaultAmount]);

    const handleProceed = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setIsInitializing(true);

        if (method === 'card') {
            try {
                const response = await fetch('/api/payments/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        property_id: propertyId,
                        res_id: reservationId,
                        amount: numAmount,
                    }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || 'Failed to initialize payment');
                }

                const data = await response.json();
                setClientSecret(data.clientSecret);
                setStep('checkout');
            } catch (err: any) {
                console.error('Error fetching client secret:', err);
                alert("Checkout error: " + err.message);
            } finally {
                setIsInitializing(false);
            }
        } else {
            try {
                const { error } = await supabase.from('payments').insert([{
                    property_id: propertyId,
                    res_id: reservationId || null,
                    amount: numAmount,
                    method: method,
                    status: 'succeeded',
                    currency: 'usd',
                    notes: notes
                }]);

                if (error) {
                    throw error;
                }

                handleSuccess();
            } catch (err: any) {
                console.error('Error recording manual payment:', err);
                alert("Payment error: " + err.message);
            } finally {
                setIsInitializing(false);
            }
        }
    };

    const handleSuccess = () => {
        onPaymentSuccess();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Process Payment">
            <div className="p-4 space-y-4">
                {guestName && (
                    <p className="text-sm text-slate-500 mb-4">
                        For {guestName}
                    </p>
                )}

                {step === 'amount' && (
                    <div className="space-y-4">
                        <div>
                            <Input
                                label="Amount to Charge ($)"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e: any) => setAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                            <select
                                className="w-full p-2 border rounded"
                                value={method}
                                onChange={(e: any) => setMethod(e.target.value)}
                            >
                                <option value="card">Credit Card (Stripe)</option>
                                <option value="cash">Cash</option>
                                <option value="check">Check</option>
                                <option value="transfer">Bank Transfer</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        {method !== 'card' && (
                            <div>
                                <Input
                                    label="Notes (Optional)"
                                    value={notes}
                                    onChange={(e: any) => setNotes(e.target.value)}
                                    placeholder="Reference #, etc."
                                />
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={onClose} disabled={isInitializing}>Cancel</Button>
                            <Button onClick={handleProceed} disabled={isInitializing}>
                                {isInitializing ? 'Processing...' : (method === 'card' ? 'Proceed to Checkout' : 'Record Payment')}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'checkout' && clientSecret && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="mb-6 bg-blue-50/50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
                            <span className="text-slate-600 font-medium">Amount to Charge:</span>
                            <span className="text-2xl font-bold text-slate-900">${parseFloat(amount).toFixed(2)}</span>
                        </div>
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                            <CheckoutForm onSuccess={handleSuccess} onCancel={onClose} />
                        </Elements>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PaymentModal;
