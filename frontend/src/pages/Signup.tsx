import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Hotel, Mail, Lock, Loader2, AlertCircle, User, Phone, MapPin, Building2, ChevronRight, ChevronLeft, KeyRound } from 'lucide-react';
import { Button, Input } from '../components/UIComponents';
import { logger } from '../lib/logger';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
    const [step, setStep] = useState(1);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [propertyName, setPropertyName] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    // Redirect if already logged in (but not while we are actively signing up or if there's an error)
    React.useEffect(() => {
        if (!authLoading && user && !loading && !error && step < 3) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, authLoading, navigate, loading, error, step]);

    const validateStep1 = () => {
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return false;
        }
        setError(null);
        return true;
    };

    const validateStep2 = () => {
        if (!organizationName || !propertyName) {
            setError("Organization Name and Primary Property Name are required");
            return false;
        }
        const phoneRegex = /^[\d\s\-\+\(\)]*$/;
        if (phone && !phoneRegex.test(phone)) {
            setError("Please enter a valid phone number format");
            return false;
        }
        setError(null);
        return true;
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
            }
        }
    };

    const handlePrevStep = () => {
        setError(null);
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (step === 1) {
            handleNextStep();
            return;
        }

        if (step === 2) {
            if (!validateStep2()) return;
            setLoading(true);

            try {
                // 1. Sign up user via Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                        }
                    }
                });

                if (authError) throw authError;

                const userId = authData.user?.id;
                if (!userId) {
                    throw new Error("Failed to create user session on auth");
                }

                // If email confirmation is disabled, session is returned immediately
                if (authData.session) {
                    // Call secure backend function to orchestrate Property & User linkage immediately
                    const { data: propertyId, error: rpcError } = await supabase.rpc('signup_new_organization', {
                        p_user_id: userId,
                        p_email: email,
                        p_first_name: firstName,
                        p_last_name: lastName,
                        p_org_name: organizationName,
                        p_prop_name: propertyName,
                        p_phone: phone,
                        p_location: location
                    });

                    if (rpcError) throw rpcError;

                    logger.info(`New property signed up: ${propertyName}`, { type: 'AUTH', event: 'SIGNUP_SUCCESS', details: { email, propertyId } });
                    
                    window.location.replace('/#/dashboard');
                    window.location.reload();
                } else {
                    // Go to Step 3 for OTP code verification
                    setStep(3);
                }
            } catch (err: any) {
                logger.warn(`Signup failed for ${email}`, { type: 'AUTH', event: 'SIGNUP_FAILED', details: { email, error: err.message } });
                setError(err.message || 'Failed to sign up');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otpToken || otpToken.length < 6) {
            setError("Please enter a valid 6-digit confirmation code");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Verify the email code with Supabase
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otpToken,
                type: 'signup'
            });

            if (verifyError) throw verifyError;

            const userId = verifyData.user?.id;
            if (!userId) {
                throw new Error("Verification succeeded but no user ID was returned");
            }

            // Call secure backend function to orchestrate Property & User linkage
            const { data: propertyId, error: rpcError } = await supabase.rpc('signup_new_organization', {
                p_user_id: userId,
                p_email: email,
                p_first_name: firstName,
                p_last_name: lastName,
                p_org_name: organizationName,
                p_prop_name: propertyName,
                p_phone: phone,
                p_location: location
            });

            if (rpcError) throw rpcError;

            logger.info(`New property signed up post-OTP: ${propertyName}`, { type: 'AUTH', event: 'SIGNUP_SUCCESS_OTP', details: { email, propertyId } });

            // Automatically navigate to dashboard upon successful creation and verification
            window.location.replace('/#/dashboard');
            window.location.reload();

        } catch (err: any) {
            logger.warn(`OTP verification failed for ${email}`, { type: 'AUTH', event: 'OTP_FAILED', details: { email, error: err.message } });
            setError(err.message || 'Verification failed. Please check the code and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center">
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0" />

            <div className="w-full max-w-2xl space-y-8 relative z-10 animate-fadeScaleIn my-8">
                {/* Logo Header */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/20 ring-1 ring-black/5">
                        <Hotel className="w-10 h-10 text-gold-400 drop-shadow-lg" />
                    </div>
                    <h2 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
                        Get Started with Cardea
                    </h2>
                    <p className="mt-3 text-slate-200 text-lg font-light">
                        Create your organization and register your property
                    </p>
                </div>

                <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50">
                    
                    {/* Stepper Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gold-500 transition-all duration-300 z-0" style={{ width: `${(step - 1) * 50}%` }} />
                            
                            <div className="z-10 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${step >= 1 ? 'bg-gold-500 border-gold-500 text-white shadow' : 'bg-white border-slate-300 text-slate-500'}`}>
                                    1
                                </div>
                                <span className="text-[10px] md:text-xs font-semibold text-slate-500 mt-1">Credentials</span>
                            </div>
                            
                            <div className="z-10 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${step >= 2 ? 'bg-gold-500 border-gold-500 text-white shadow shadow-gold-500/20' : 'bg-white border-slate-300 text-slate-500'}`}>
                                    2
                                </div>
                                <span className="text-[10px] md:text-xs font-semibold text-slate-500 mt-1">Property Setup</span>
                            </div>
                            
                            <div className="z-10 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${step >= 3 ? 'bg-gold-500 border-gold-500 text-white shadow shadow-gold-500/20' : 'bg-white border-slate-300 text-slate-500'}`}>
                                    3
                                </div>
                                <span className="text-[10px] md:text-xs font-semibold text-slate-500 mt-1">Verification</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100 mb-6">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSignupSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-2">Personal Details</h3>
                                </div>
                                
                                <Input
                                    label="First Name"
                                    type="text"
                                    placeholder="Jane"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="bg-white"
                                    icon={User}
                                />

                                <Input
                                    label="Last Name"
                                    type="text"
                                    placeholder="Doe"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="bg-white"
                                    icon={User}
                                />

                                <div className="md:col-span-2">
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        placeholder="name@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white"
                                        icon={Mail}
                                    />
                                </div>

                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white"
                                    icon={Lock}
                                />

                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-white"
                                    icon={Lock}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    icon={ChevronRight}
                                    className="px-6 py-3 font-semibold shadow-md transition-all active:scale-[0.98]"
                                >
                                    Next: Property Details
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSignupSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-2">Organization & Property Details</h3>
                                </div>

                                <div className="md:col-span-2">
                                    <Input
                                        label="Organization / Company Name"
                                        type="text"
                                        placeholder="Cardea Holdings LLC"
                                        required
                                        value={organizationName}
                                        onChange={(e) => setOrganizationName(e.target.value)}
                                        className="bg-white"
                                        icon={Building2}
                                    />
                                </div>

                                <Input
                                    label="Primary Property Name"
                                    type="text"
                                    placeholder="Grand Plaza Hotel"
                                    required
                                    value={propertyName}
                                    onChange={(e) => setPropertyName(e.target.value)}
                                    className="bg-white"
                                    icon={Hotel}
                                />

                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="bg-white"
                                    icon={Phone}
                                />

                                <div className="md:col-span-2">
                                    <Input
                                        label="Location / Address"
                                        type="text"
                                        placeholder="123 Ocean Drive, Miami FL"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="bg-white"
                                        icon={MapPin}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handlePrevStep}
                                    icon={ChevronLeft}
                                    className="font-semibold"
                                >
                                    Back
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 font-semibold shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Signing up...
                                        </>
                                    ) : (
                                        'Complete Signup'
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-gold-100">
                                    <KeyRound className="w-8 h-8 text-gold-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Confirm Your Identity</h3>
                                <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                                    We sent a 6-digit confirmation code to <span className="font-semibold text-slate-800">{email}</span>.
                                    Please enter it below to confirm your account and activate your property dashboard.
                                </p>
                            </div>

                            <div className="max-w-xs mx-auto">
                                <Input
                                    label="6-Digit Code"
                                    type="text"
                                    placeholder="123456"
                                    required
                                    value={otpToken}
                                    onChange={(e) => setOtpToken(e.target.value.trim())}
                                    className="bg-white text-center text-lg tracking-widest font-mono py-3"
                                    maxLength={6}
                                />
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handlePrevStep}
                                    icon={ChevronLeft}
                                    className="font-semibold"
                                >
                                    Back
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 font-semibold shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify & Complete'
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                {step < 3 && (
                    <p className="text-center text-base text-slate-300">
                        Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-lg font-bold text-white hover:text-gold-400 underline decoration-gold-400/50 hover:decoration-gold-400 transition-all cursor-pointer bg-transparent border-none p-0 outline-none">Sign In</button>
                    </p>
                )}

                <div className="pt-8 text-center pb-8 border-t border-white/10 mt-6">
                    <div className="flex items-center justify-center gap-6 mb-4 text-xs font-semibold text-slate-400">
                        <button type="button" onClick={() => navigate('/terms')} className="hover:text-white transition-colors">Terms of Service</button>
                        <button type="button" onClick={() => navigate('/eula')} className="hover:text-white transition-colors">EULA</button>
                    </div>
                    <p className="text-sm text-slate-400 font-medium tracking-wide">
                        Architected by <a href="https://www.linkedin.com/in/jason-ruiz-it" target="_blank" rel="noopener noreferrer" className="text-base font-bold text-slate-300 hover:text-gold-400 transition-colors">Jason Ruiz @jruizdesign</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
