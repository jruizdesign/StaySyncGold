import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser } from '../types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: AppUser | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('LIVE_TRIAL') === 'true') {
            const mockUser: AppUser = {
                id: 'mock-admin-1',
                email: 'demo@cardea.app',
                role: 'admin',
                propertyId: 'mock-property-1',
                propertyName: 'Cardea Grand Hotel',
                isAdmin: true,
                isManager: true,
                isDemoMode: true,
                agreedToLegal: true,
                subscriptionTier: 'professional'
            };
            setUser(mockUser);
            setSession({ user: { id: mockUser.id, email: mockUser.email } } as any);
            setLoading(false);
            return;
        }

        // 1. Check active session - REMOVED (Redundant with onAuthStateChange)
        // supabase.auth.getSession().then(({ data: { session } }) => {
        //     setSession(session);
        //     if (session?.user) {
        //         fetchUserProfile(session.user.id, session.user.email!);
        //     } else {
        //         setLoading(false);
        //     }
        // });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchUserProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string, email: string) => {
        try {
            console.log(`[Auth] Fetching profile for ${email} (Auth ID: ${userId})`);

            // 1. Try fetching by Auth ID (Standard)
            let { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error || !data) {
                console.warn(`[Auth] ID lookup failed: ${error?.message || 'User not found'}. Trying email...`);
                // 2. Fallback: Try fetching by Email (Manual entry mismatch fix)
                const { data: emailData, error: emailError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();

                if (emailData) {
                    console.log(`[Auth] Found user by email. DB ID: ${emailData.id}`);
                    data = emailData;
                } else {
                    console.error(`[Auth] Email lookup also failed:`, emailError);
                }
            }

            // Fetch Property Details if property_id exists
            let propertyName = undefined;
            let isDemoMode = false;
            let subscriptionTier = undefined;
            if (data?.property_id) {
                const { data: propertyData } = await supabase
                    .from('properties')
                    .select('name, demo_mode, subscription_tier')
                    .eq('id', data.property_id)
                    .single();

                if (propertyData) {
                    propertyName = propertyData.name;
                    isDemoMode = propertyData.demo_mode;
                    subscriptionTier = propertyData.subscription_tier;
                }
            }

            if (data) {
                console.log(`[Auth] Profile loaded. Admin: ${data.isAdmin}`);
                const appUser: AppUser = {
                    id: data.id, // Using DB ID
                    email: data.email,
                    role: data.role as 'admin' | 'manager' | 'staff',
                    propertyId: data.property_id,
                    propertyName: propertyName,
                    isAdmin: data.isAdmin, // Using the column from DB
                    isManager: data.isManager || data.role === 'manager', // specific boolean or role-based fallback
                    isDemoMode: isDemoMode,
                    agreedToLegal: data.agreed_to_legal,
                    subscriptionTier: subscriptionTier
                };
                setUser(appUser);
            } else {
                console.warn('[Auth] No profile found in public.users. Using default staff fallback.');
                // Determine user role or create default profile if needed (Production logic)
                setUser({
                    id: userId,
                    email: email,
                    role: 'staff',
                });
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        if (typeof window !== 'undefined' && localStorage.getItem('LIVE_TRIAL') === 'true') {
            localStorage.removeItem('LIVE_TRIAL');
            setUser(null);
            setSession(null);
            window.location.href = '/';
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const value = {
        user,
        session,
        loading,
        signOut
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
