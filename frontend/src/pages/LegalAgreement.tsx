import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FileText, Shield, Server, CheckSquare, Loader2 } from 'lucide-react';
import { Button } from '../components/UIComponents';

const LegalAgreement: React.FC = () => {
    const { user } = useAuth();
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSign = async () => {
        if (!agreed) {
            setError('You must agree to all policies to continue.');
            return;
        }
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const { error: dbError } = await supabase
                .from('users')
                .update({ agreed_to_legal: true })
                .eq('id', user.id);

            if (dbError) throw dbError;

            // Force reload to refresh context state and enter the dashboard
            window.location.replace('/#/dashboard');
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-0" />

            <div className="w-full max-w-3xl space-y-6 relative z-10 my-8">
                <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-gold-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800">Review & Sign Agreements</h2>
                        <p className="mt-2 text-slate-600">Please review our updated legal policies to activate your StaySyncGold account.</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <a href="#/terms" target="_blank" className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                            <FileText className="w-6 h-6 text-slate-500 mr-4" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800">Terms of Service</h4>
                                <p className="text-sm text-slate-500">Subscription rules, liability, and usage conditions.</p>
                            </div>
                        </a>
                        
                        <a href="/docs/legal/PrivacyPolicy.md" target="_blank" className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                            <Server className="w-6 h-6 text-slate-500 mr-4" />
                            <div className="flex-1">
                                <h4 className="font-semibold text-slate-800">Privacy Policy & DPA</h4>
                                <p className="text-sm text-slate-500">Data protection compliance and processing details.</p>
                            </div>
                        </a>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex items-start gap-4 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <input
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            id="agreeCheckbox"
                        />
                        <label htmlFor="agreeCheckbox" className="text-sm text-slate-700 cursor-pointer">
                            By checking this box, I acknowledge that I have read and agree to be bound by the StaySyncGold Terms of Service, Privacy Policy, Data Processing Agreement, and Service Level Agreement. This serves as my electronic signature.
                        </label>
                    </div>

                    <Button
                        onClick={handleSign}
                        disabled={loading || !agreed}
                        className="w-full py-4 text-lg justify-center shadow-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckSquare className="w-5 h-5 mr-2" />
                                Sign & Continue
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LegalAgreement;
