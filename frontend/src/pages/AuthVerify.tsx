import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/UIComponents';
import type { EmailOtpType } from '@supabase/supabase-js';

const AuthVerify: React.FC = () => {
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const hasRun = useRef(false);

    useEffect(() => {
        // StrictMode safe-guard so it doesn't run the OTP consumption twice in development
        if (hasRun.current) return;
        hasRun.current = true;

        const verifyEmail = async () => {
            try {
                // Parse standard URL search params, since the hash router stores it before the #
                // example: http://site.com/?token_hash=ABC&type=signup#/verify
                const urlParams = new URLSearchParams(window.location.search);
                const token_hash = urlParams.get('token_hash');
                const type = urlParams.get('type') as EmailOtpType;

                if (!token_hash || !type) {
                    throw new Error("Invalid verification link. Missing security token.");
                }

                const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash,
                    type,
                });

                if (verifyError) throw verifyError;

                // Verification successful
                setSuccess(true);
                
                // Allow user a moment to see the success state before bouncing to the onboarding flow
                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 2000);

            } catch (err: any) {
                console.error("OTP Verification Error:", err);
                setError(err.message || 'The verification link is invalid or has expired.');
            } finally {
                setVerifying(false);
            }
        };

        verifyEmail();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0" />
            <div className="w-full max-w-lg space-y-8 relative z-10 animate-fadeScaleIn">
                <div className="bg-white/95 backdrop-blur-xl p-10 rounded-2xl shadow-2xl border border-white/50 text-center">
                    
                    {verifying ? (
                        <>
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">Verifying...</h2>
                            <p className="text-slate-600 text-lg">Securely authenticating your session. Please wait.</p>
                        </>
                    ) : error ? (
                        <>
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-red-50">
                                <AlertCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">Verification Failed</h2>
                            <p className="text-slate-600 text-lg mb-8">{error}</p>
                            <Button
                                onClick={() => navigate('/login')}
                                className="w-full justify-center py-4 text-base font-semibold shadow-lg bg-slate-900 border-slate-900 text-white"
                            >
                                Return to Login
                            </Button>
                        </>
                    ) : success ? (
                        <>
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-emerald-50">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">Verification Success!</h2>
                            <p className="text-slate-600 text-lg mb-8">Your account has been securely verified. Redirecting you to the portal...</p>
                        </>
                    ) : null}

                </div>
            </div>
        </div>
    );
};

export default AuthVerify;
