import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge } from '../components/UIComponents';
import { Check, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    description: 'Perfect for single properties getting started.',
    features: ['Core PMS functionality', 'Calendar & Reservations', 'Basic Reporting', 'Up to 2 Staff Users']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    isPopular: true,
    description: 'Advanced tools for growing hospitality businesses.',
    features: ['Everything in Starter', 'Advanced Reporting', 'Unlimited Staff Users', 'Multi-property Support', 'API Access']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'Dedicated support and white-labeling for large scales.',
    features: ['Everything in Professional', 'White-labeling', 'Dedicated Account Manager', 'Custom Integrations', '24/7 Priority Support']
  }
];

const MODULES = [
  { id: 'finance', name: 'Financial & Accounting', price: 29, description: 'Advanced P&L, universal ledgers, and expense tracking workflows.' },
  { id: 'quickbooks', name: 'QuickBooks Sync', price: 19, description: 'Automated 2-way sync with your QuickBooks Online account.' },
  { id: 'payments', name: 'Payment Processing', price: 10, description: 'Live credit card processing via Stripe Checkout gateways.' },
  { id: 'channel', name: 'Channel Manager', price: 39, description: 'Sync rates & availability natively with Booking.com, Airbnb, Expedia.' },
  { id: 'ai', name: 'Operational AI', price: 49, description: 'Generative AI insights, automated briefings, and strategic ops algorithms.' },
];

const Pricing: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedTier, setSelectedTier] = useState('professional');
    const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
        finance: false,
        quickbooks: false,
        payments: false,
        channel: false,
        ai: false
    });

    const [promoCode, setPromoCode] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const toggleModule = (id: string) => {
        setActiveModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const calculateTotal = () => {
        const tier = TIERS.find(t => t.id === selectedTier);
        let total = tier && typeof tier.price === 'number' ? tier.price : 0;
        
        MODULES.forEach(mod => {
            if (activeModules[mod.id]) total += mod.price;
        });
        return total;
    };

    const handleCheckout = async () => {
        if (promoCode.toUpperCase() === 'STAYSYNC2026') {
            if (!user?.propertyId) return alert('No property context found. Please log in again.');
            setIsProcessing(true);
            const { error } = await supabase.from('properties')
                .update({
                    subscription_tier: selectedTier,
                    enable_finance_module: activeModules.finance,
                    enable_quickbooks: activeModules.quickbooks,
                    enable_payments: activeModules.payments,
                    enable_channel_manager: activeModules.channel,
                    enable_ai: activeModules.ai
                })
                .eq('id', user.propertyId);

            setIsProcessing(false);
            if (error) {
                alert('Error unlocking app: ' + error.message);
            } else {
                alert('App Unlocked Successfully! Welcome to StaySync Gold.');
                window.location.href = '/dashboard';
            }
        } else {
            alert(`Proceeding to specific Stripe Checkout session for ${isEnterprise ? 'Enterprise' : '$' + calculateTotal() + '/mo'}...`);
        }
    };

    const isEnterprise = selectedTier === 'enterprise';

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 pt-20 pb-32 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 relative z-10 tracking-tight">Simple, modular pricing.</h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto relative z-10">
                    Pay only for what you need. Start with a solid foundation and add powerful modules as your property grows.
                </p>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {TIERS.map((tier) => (
                        <div 
                            key={tier.id} 
                            className={`relative bg-white rounded-2xl border border-slate-200 transition-all duration-300 cursor-pointer overflow-hidden ${
                                selectedTier === tier.id ? 'ring-2 ring-gold-500 shadow-2xl scale-105 md:-translate-y-2' : 'hover:shadow-xl hover:-translate-y-1 opacity-90 hover:opacity-100'
                            }`}
                            onClick={() => setSelectedTier(tier.id)}
                        >
                            {tier.isPopular && (
                                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            )}
                            {tier.isPopular && (
                                <div className="absolute top-5 right-5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <Sparkles className="w-3 h-3" /> Popular
                                </div>
                            )}
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{tier.name}</h3>
                                <p className="text-sm text-slate-500 mb-6 min-h-[40px] leading-relaxed">{tier.description}</p>
                                <div className="mb-8">
                                    {typeof tier.price === 'number' ? (
                                        <div className="flex items-baseline text-slate-900">
                                            <span className="text-5xl font-extrabold tracking-tighter">${tier.price}</span>
                                            <span className="text-slate-500 ml-1.5 font-medium">/mo</span>
                                        </div>
                                    ) : (
                                        <div className="text-4xl font-extrabold tracking-tight text-slate-900 pb-2">{tier.price}</div>
                                    )}
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            </div>
                                            <span className="text-sm text-slate-700 font-medium leading-relaxed">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button 
                                    className={`w-full py-3 h-auto text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                                        selectedTier === tier.id 
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20' 
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    {selectedTier === tier.id ? 'Active Tier' : 'Select ' + tier.name}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add-on Modules Configurator */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-16 transition-all duration-500">
                    <div className="border-b border-slate-100 p-8 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
                                <div className="p-2.5 bg-indigo-100 rounded-xl">
                                    <Building2 className="w-6 h-6 text-indigo-600" />
                                </div>
                                Custom Add-Ons
                            </h2>
                            <p className="text-slate-500 mt-2 text-lg">Activate premium features to turbocharge your operations.</p>
                        </div>
                        <div className="bg-slate-900 text-white rounded-2xl p-5 min-w-[220px] text-center shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1.5">Total Monthly Cost</p>
                            {isEnterprise ? (
                                <p className="text-4xl font-extrabold tracking-tight">Custom</p>
                            ) : (
                                <div className="flex justify-center items-baseline transform transition-transform group-hover:scale-105">
                                    <span className="text-2xl font-bold text-indigo-200 mr-1">$</span>
                                    <p className="text-5xl font-black tracking-tighter">{calculateTotal()}</p>
                                    <span className="text-lg text-slate-400 font-medium ml-1">/mo</span>
                                </div>
                            )}
                        </div>
                    </div>
                
                    <div className="divide-y divide-slate-100">
                        {MODULES.map(mod => (
                            <div 
                                key={mod.id} 
                                className={`p-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 cursor-pointer ${
                                    activeModules[mod.id] ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                                }`}
                                onClick={() => toggleModule(mod.id)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h4 className="text-lg font-bold text-slate-900">{mod.name}</h4>
                                        {activeModules[mod.id] && (
                                            <div className="ml-2 font-bold uppercase tracking-wider text-[10px]">
                                                <Badge color="blue">Added to Plan</Badge>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">{mod.description}</p>
                                </div>
                                <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-slate-900">+${mod.price}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">/ month</p>
                                    </div>
                                    
                                    {/* Custom Toggle Switch */}
                                    <div 
                                        className={`relative w-16 h-8 rounded-full p-1 border-2 transition-all duration-300 ease-in-out flex items-center ${
                                            activeModules[mod.id] 
                                                ? 'bg-indigo-600 border-indigo-600 shadow-inner' 
                                                : 'bg-slate-100 border-slate-200'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-spring ${
                                            activeModules[mod.id] ? 'translate-x-8' : 'translate-x-0 cursor-pointer'
                                        }`} >
                                            {activeModules[mod.id] && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-indigo-600" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex-1 space-y-4 w-full sm:w-auto">
                            <p className="text-sm text-slate-500 flex items-center gap-2.5 font-medium">
                                <div className="p-1.5 bg-emerald-100 rounded-full">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                </div>
                                Prices are automatically prorated based on today's activation date.
                            </p>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Enter Promo Code" 
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm uppercase max-w-[200px]"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                />
                                {promoCode && <span className="text-xs text-indigo-600 font-semibold">Code applied</span>}
                            </div>
                        </div>
                        <Button 
                            className="w-full sm:w-auto bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800 px-10 py-4 text-base font-bold uppercase tracking-wide h-auto shadow-xl shadow-slate-900/20 transition-all hover:shadow-slate-900/30 hover:-translate-y-0.5" 
                            onClick={handleCheckout}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                        </Button>
                    </div>
                </div>

                <div className="text-center">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-900 font-medium">
                        &larr; Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
