import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '../components/UIComponents';

const TermsOfService: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                        <FileText className="w-5 h-5" />
                        <span className="tracking-wide text-sm">Valid Legal Document</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 animate-fadeScaleIn">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Terms of Service</h1>
                    <p className="text-slate-500 mb-10 pb-6 border-b border-slate-100 font-medium">Last Updated: March 21, 2026</p>

                    <div className="prose prose-slate prose-lg max-w-none text-slate-600 space-y-6">
                        <p>
                            Welcome to Cardea Property Management ("Service"). These Terms of Service ("Terms") govern your use of the SaaS platform operated by Cardea ("us", "we", or "our").
                        </p>
                        <p>
                            By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. Accounts and Registration</h2>
                        <p>
                            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>
                        <p>
                            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Subscription and Billing</h2>
                        <p>
                            The Service is billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.
                        </p>
                        <p>
                            You must provide Cardea with accurate and complete billing information including full name, address, state, zip code, telephone number, and a valid payment method information.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Acceptable Use Policy</h2>
                        <p>You agree not to use the Service:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>In any way that violates any applicable national or international law or regulation.</li>
                            <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way.</li>
                            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                            <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. Intellectual Property</h2>
                        <p>
                            The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Cardea and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Links to Other Web Sites</h2>
                        <p>
                            Our Service may contain links to third-party web sites or services that are not owned or controlled by Cardea.
                        </p>
                        <p>
                            Cardea has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party web sites or services. You further acknowledge and agree that Cardea shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">6. Termination</h2>
                        <p>
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                        <p>
                            Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">7. Changes to Terms</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">8. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at <a href="mailto:legal@staysyncos.com" className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300 underline-offset-4">legal@staysyncos.com</a>.
                        </p>
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <Button onClick={() => navigate('/signup')} className="w-full sm:w-auto px-10 py-3 text-lg font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-700 text-white">
                            I Agree & Continue
                        </Button>
                        <p className="mt-4 text-xs text-slate-400">Your agreement will be recorded electronically upon account creation.</p>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Cardea Property Management. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
