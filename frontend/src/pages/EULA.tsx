import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '../components/UIComponents';

const EULA: React.FC = () => {
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
                    <div className="flex items-center gap-2 text-gold-600 font-bold bg-gold-50 px-4 py-2 rounded-lg border border-gold-200">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="tracking-wide text-sm">Valid Legal Document</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 animate-fadeScaleIn">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">End User License Agreement (EULA)</h1>
                    <p className="text-slate-500 mb-10 pb-6 border-b border-slate-100 font-medium">Last Updated: March 12, 2026</p>

                    <div className="prose prose-slate prose-lg max-w-none text-slate-600">
                        <p>
                            This End User License Agreement ("Agreement") is a legal agreement between you ("User" or "you") and Cardea ("Company," "we," "us," or "our") governing your use of the Cardea property management software, applications, and related services (collectively, the "Software").
                        </p>
                        <p>
                            By accessing, installing, or using the Software, you agree to be bound by the terms of this Agreement. If you do not agree to these terms, do not use the Software.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">1. License Grant</h2>
                        <p>
                            Subject to your compliance with this Agreement and payment of any applicable fees, Company grants you a limited, non-exclusive, non-transferable, non-sublicensable license to access and use the Software for your internal business purposes related to property management.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">2. Restrictions</h2>
                        <p>You shall not:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Copy, modify, translate, or create derivative works of the Software.</li>
                            <li>Reverse engineer, decompile, disassemble, or attempt to derive the source code of the Software.</li>
                            <li>Rent, lease, lend, sell, sublicense, assign, distribute, or otherwise transfer your rights in the Software to any third party.</li>
                            <li>Use the Software to provide services to third parties in a timeshare or service bureau arrangement (unless explicitly permitted by your subscription tier).</li>
                            <li>Remove any proprietary notices or labels on the Software.</li>
                            <li>Use the Software in any manner that could disable, overburden, damage, or impair the service or interfere with any other party's use.</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">3. Account Security</h2>
                        <p>
                            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or use of your account.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">4. User Data</h2>
                        <p>
                            You retain all rights to the data, information, and content you input into the Software ("User Data"). By using the Software, you grant us a worldwide, non-exclusive license to host, copy, transmit, and display User Data solely as necessary for us to provide the Software to you. You are solely responsible for the accuracy, quality, and legality of your User Data.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">5. Intellectual Property</h2>
                        <p>
                            The Software and all worldwide intellectual property rights therein are the exclusive property of Company and its licensors. All rights in and to the Software not expressly granted to you in this Agreement are reserved by Company.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">6. Term and Termination</h2>
                        <p>
                            This Agreement remains in effect until terminated. Your license to use the Software will terminate automatically without notice from us if you fail to comply with any provision of this Agreement. Upon termination, you must cease all use of the Software.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">7. Disclaimer of Warranties</h2>
                        <p className="uppercase text-sm tracking-wider font-semibold text-slate-700 bg-slate-100 p-4 rounded-lg">
                            The Software is provided "as is" and "as available" without warranty of any kind. To the maximum extent permitted by applicable law, Company disclaims all warranties, whether express, implied, statutory or otherwise, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">8. Limitation of Liability</h2>
                        <p className="uppercase text-sm tracking-wider font-semibold text-slate-700 bg-slate-100 p-4 rounded-lg">
                            To the maximum extent permitted by applicable law, in no event shall Company be liable for any indirect, punitive, incidental, special, consequential or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data or other intangible losses, arising out of or relating to the use of, or inability to use, the Software.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">9. Governing Law</h2>
                        <p>
                            This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Company is established, without regard to its conflict of law principles.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">10. Modifications</h2>
                        <p>
                            We reserve the right to modify this Agreement at any time. We will provide notice of any material changes. Your continued use of the Software following such notice constitutes your acceptance of the modified Agreement.
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-4">11. Contact Information</h2>
                        <p>
                            If you have any questions about this Agreement, please contact us at <a href="mailto:support@staysyncos.com" className="text-gold-600 hover:text-gold-700 font-semibold underline decoration-gold-300 underline-offset-4">support@staysyncos.com</a>.
                        </p>
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <Button onClick={() => navigate('/signup')} className="w-full sm:w-auto px-10 py-3 text-lg font-bold shadow-lg shadow-gold-500/20 active:scale-[0.98] transition-all">
                            Accept & Sign Up
                        </Button>
                        <p className="mt-4 text-xs text-slate-400">By clicking "Accept & Sign Up", you agree to all terms outlined above.</p>
                    </div>
                </div>
                
                <div className="mt-8 text-center text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} Cardea Property Management. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default EULA;
