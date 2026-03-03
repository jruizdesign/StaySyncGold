import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Modal, Button, Input } from './UIComponents';
import { useAuth } from '../context/AuthContext';

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
    const [isInitializing, setIsInitializing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('amount');
            setClientSecret('');
            setAmount(defaultAmount.toString());
        }
    }, [isOpen, defaultAmount]);

    const handleProceedToCheckout = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setIsInitializing(true);
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
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="ghost" onClick={onClose} disabled={isInitializing}>Cancel</Button>
                            <Button onClick={handleProceedToCheckout} disabled={isInitializing}>
                                {isInitializing ? 'Connecting to Stripe...' : 'Proceed to Checkout'}
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
