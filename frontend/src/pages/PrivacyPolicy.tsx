import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, ArrowLeft } from 'lucide-react';
import { Button } from '../components/UIComponents';

const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                        <Server className="w-5 h-5" />
                        <span className="tracking-wide text-sm">Valid Legal Document</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 animate-fadeScaleIn">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Privacy Policy & DPA</h1>
                    <p className="text-slate-500 mb-10 pb-6 border-b border-slate-100 font-medium">Last Updated: March 22, 2026</p>

                    <div className="prose prose-slate prose-lg max-w-none text-slate-600 space-y-6">
                        <p>
                            StaySyncGold ("we", "us", or "our") respects your privacy and is committed to protecting the personal data of our users ("Customers") and their end-users ("Guests"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SaaS property management system (the "Service").
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Information We Collect</h2>
                        <p>
                            We collect Personal Data explicitly provided by you (Name, Email, Phone, Billing Information) as well as End-User (Guest) Data determining reservations and identities. We act strictly as a <strong>Data Processor</strong> for Guest Data.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Third-Party Service Providers (Sub-Processors)</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Supabase / AWS:</strong> For database hosting, authentication, and cloud infrastructure.</li>
                            <li><strong>Stripe:</strong> For financial payment processing.</li>
                            <li><strong>Google (Gemini):</strong> For providing AI insights within the dashboard.</li>
                            <li><strong>Intuit (QuickBooks):</strong> For accounting integrations (if enabled).</li>
                            <li><strong>Channex:</strong> For channel manager synchronizations.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Data Security and Rights</h2>
                        <p>
                            We employ Data-at-Rest encryption, Row Level Security (RLS), and TLS for Data-in-Transit. Depending on your location (e.g., GDPR, CCPA), you have the right to access, update, delete, or restrict the processing of your data by contacting our Data Protection Officer.
                        </p>
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <Button onClick={() => navigate('/signup')} className="w-full sm:w-auto px-10 py-3 text-lg font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-700 text-white">
                            I Agree & Continue
                        </Button>
                        <p className="mt-4 text-xs text-slate-400">Your agreement will be recorded electronically upon account creation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
