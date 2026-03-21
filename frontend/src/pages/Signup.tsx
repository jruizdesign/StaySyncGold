import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Hotel, Mail, Lock, Loader2, AlertCircle, User, Phone, MapPin, Building2 } from 'lucide-react';
import { Button, Input } from '../components/UIComponents';
import { logger } from '../lib/logger';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [propertyName, setPropertyName] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    // Redirect if already logged in (but not while we are actively signing up)
    React.useEffect(() => {
        if (!authLoading && user && !loading) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, authLoading, navigate, loading]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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

            // Optional: If email confirmation is enabled, we might not get user data immediately
            const userId = authData.user?.id;

            if (!userId) {
                // If email confirmation is required, handle gracefully
                navigate('/login');
                return;
            }

            // 2. Create Property Record
            const { data: propertyData, error: propertyError } = await supabase
                .from('properties')
                .insert({
                    name: propertyName,
                    organization_name: organizationName,
                    phone: phone,
                    location: location,
                    email: email, // Contact email for property
                    demo_mode: false,
                    ownerName: `${firstName} ${lastName}`
                })
                .select()
                .single();

            if (propertyError) throw propertyError;

            const propertyId = propertyData.id;

            // 3. Ensure User Record Exists & Update with Role/Property
            // Note: If a trigger creates the user, we should update it.
            // If no trigger exists, we upsert.
            const { error: userError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    property_id: propertyId,
                    role: 'admin',
                    isAdmin: true,
                    isOwner: true,
                    isManager: true
                }, { onConflict: 'id' });

            if (userError) throw userError;

            // 4. Create Organization Settings
            const { error: orgSettingsError } = await supabase
                .from('organization_settings')
                .insert({
                    property_id: propertyId,
                    enable_dynamic_pricing: false
                });

            if (orgSettingsError) throw orgSettingsError;

            logger.info(`New property signed up: ${propertyName}`, { type: 'AUTH', event: 'SIGNUP_SUCCESS', details: { email, propertyId } });

            // Automatically navigate to dashboard upon successful creation
            // Use window.location to force a full reload so AuthContext refetches the updated user record
            // with the newly attached property_id.
            window.location.href = '/dashboard';

        } catch (err: any) {
            logger.warn(`Signup failed for ${email}`, { type: 'AUTH', event: 'SIGNUP_FAILED', details: { email, error: err.message } });
            setError(err.message || 'Failed to sign up');
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
                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

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

                            <div className="md:col-span-2 mt-4">
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

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full justify-center py-4 text-base font-semibold shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 transition-all active:scale-[0.98] mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Creating Account...
                                </>
                            ) : (
                                'Complete Signup'
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-base text-slate-300">
                    Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-lg font-bold text-white hover:text-gold-400 underline decoration-gold-400/50 hover:decoration-gold-400 transition-all">Sign In</button>
                </p>

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
