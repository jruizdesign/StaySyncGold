import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Hotel, Mail, Lock, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button, Input } from '../components/UIComponents';
import { logger } from '../lib/logger';

const Login: React.FC = () => {
    const { user, loading: authLoading } = useAuth(); // Get auth state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [keepLoggedIn, setKeepLoggedIn] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Redirect if already logged in
    React.useEffect(() => {
        console.log('[Login] Check redirect. Loading:', authLoading, 'User:', user?.email);
        if (!authLoading && user) {
            console.log('[Login] Redirecting to dashboard...');
            navigate('/dashboard', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Persistence logic removed to prevent crash. 
            // Default Supabase behavior (local storage) applies.

            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Log successful login
            // Note: We don't have the user object fully populated here yet, but we have the email.
            // Ideally validation happens after, but for now we log the attempt.
            logger.info(`User logged in: ${email}`, { type: 'AUTH', event: 'LOGIN_SUCCESS', details: { email } });

            navigate('/dashboard');
        } catch (err: any) {
            logger.warn(`Login failed for ${email}`, { type: 'AUTH', event: 'LOGIN_FAILED', details: { email, error: err.message } });
            setError(err.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0" />

            <div className="w-full max-w-md space-y-8 relative z-10 animate-fadeScaleIn">
                {/* Logo Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/20 ring-1 ring-black/5">
                        <Hotel className="w-10 h-10 text-gold-400 drop-shadow-lg" />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
                        Cardea
                    </h2>
                    <p className="mt-3 text-slate-200 text-lg font-light">
                        Premium Hotel Management
                    </p>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm animate-shake border border-red-100">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="name@company.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white"
                                icon={Mail}
                                autoComplete="email"
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white"
                                icon={Lock}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${keepLoggedIn ? 'bg-gold-500 border-gold-500' : 'bg-white border-slate-300 group-hover:border-gold-400'}`}>
                                    {keepLoggedIn && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={keepLoggedIn}
                                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                                />
                                <span className="text-sm text-slate-600 font-medium">Keep me logged in</span>
                            </label>
                            <a href="#" className="text-sm font-semibold text-gold-600 hover:text-gold-500 transition-colors">
                                Forgot password?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full justify-center py-3 text-base font-semibold shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In to Dashboard'
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-base text-slate-300">
                    Don't have an account? <button type="button" onClick={() => navigate('/signup')} className="font-bold text-white hover:text-gold-400 underline decoration-gold-400/50 hover:decoration-gold-400 transition-all cursor-pointer bg-transparent border-none p-0 outline-none">Sign Up</button>
                </p>

                <div className="pt-8 text-center pb-8">
                    <div className="flex items-center justify-center gap-6 mb-4 text-xs font-semibold text-slate-400">
                        <button type="button" onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms of Service</button>
                        <button type="button" onClick={() => navigate('/eula')} className="hover:text-white transition-colors">EULA</button>
                    </div>
                    <p className="text-sm text-slate-400 font-medium tracking-wide">
                        Architected by <span className="text-base font-bold text-slate-300">Jason Ruiz, JTR Technology LLC.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
