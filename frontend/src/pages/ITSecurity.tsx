import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Server,
    Lock,
    Wifi,
    HardDrive,
    FileKey,
    Activity,
    CheckCircle2,
    Monitor
} from 'lucide-react';


const ITSecurity: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                        <span className="text-xl font-bold tracking-tight">StaySync<span className="text-blue-500">IT</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <button onClick={() => navigate('/digital-solutions')} className="hover:text-white transition-colors">Digital Solutions</button>
                        <a href="#" className="text-white transition-colors">IT & Security</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Client Portal
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/10 border border-blue-700/50 text-blue-400 text-xs font-semibold tracking-wide mb-8 animate-fadeIn">
                    <Shield className="w-3 h-3" />
                    ENTERPRISE-GRADE PROTECTION
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl leading-[1.1]">
                    IT Infrastructure & <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-200">Cybersecurity</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
                    Defending your data and optimizing your network performance with military-grade security standards and proactive management.
                </p>

                {/* Services Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mt-12 text-left">
                    {/* IT Management Card */}
                    <div className="bg-[#0f172a] rounded-2xl p-8 border border-slate-800 hover:border-blue-500/30 transition-all group">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-lg">
                            <Server className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Comprehensive IT Management</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Our managed IT services ensure your daily operations run smoothly. We handle updates, patches, and user management so you can focus on your core business.
                        </p>
                        <ul className="space-y-4">
                            {[
                                { icon: Activity, text: "Remote Monitoring & Management (RMM)" },
                                { icon: checkCircleIcon, text: "24/7 Help Desk Support" }, // Placeholder, will fix below
                                { icon: Monitor, text: "Hardware Procurement & Lifecycle" },
                                { icon: Wifi, text: "Network Optimization (Wi-Fi 6E)" },
                                { icon: HardDrive, text: "Cloud Infrastructure Management" }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Cybersecurity Card */}
                    <div className="bg-[#0f172a] rounded-2xl p-8 border border-slate-800 hover:border-red-500/30 transition-all group">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-lg">
                            <Lock className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Cybersecurity Defense</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Cyber threats are evolving. Our multi-layered security approach protects your endpoints, network, and cloud data from ransomware and phishing attacks.
                        </p>
                        <ul className="space-y-4">
                            {[
                                { text: "Threat Detection & Response (EDR/MDR)" },
                                { text: "Next-Gen Firewall Configuration" },
                                { text: "Security Audits & Compliance (PCI-DSS)" },
                                { text: "Employee Security Training" },
                                { text: "Data Backup & Disaster Recovery" }
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Why Choose Us Section */}
                <div className="w-full max-w-6xl mt-32 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12">Why choose StaySync Security?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0f172a]/50 p-8 rounded-2xl border border-slate-800 hover:bg-[#1e293b]/50 transition-colors">
                            <div className="w-10 h-10 bg-[#1e293b] rounded-lg flex items-center justify-center mb-4 text-white">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <h4 className="text-lg font-bold mb-2 text-white">Proactive Monitoring</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                We stop problems before they disrupt your business. Our AI-driven tools detect anomalies instantly.
                            </p>
                        </div>

                        <div className="bg-[#0f172a]/50 p-8 rounded-2xl border border-slate-800 hover:bg-[#1e293b]/50 transition-colors">
                            <div className="w-10 h-10 bg-[#1e293b] rounded-lg flex items-center justify-center mb-4 text-white">
                                <FileKey className="w-5 h-5" />
                            </div>
                            <h4 className="text-lg font-bold mb-2 text-white">Data Privacy First</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                We ensure guest data is encrypted in transit and at rest, fully compliant with GDPR and local laws.
                            </p>
                        </div>

                        <div className="bg-[#0f172a]/50 p-8 rounded-2xl border border-slate-800 hover:bg-[#1e293b]/50 transition-colors">
                            <div className="w-10 h-10 bg-[#1e293b] rounded-lg flex items-center justify-center mb-4 text-white">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h4 className="text-lg font-bold mb-2 text-white">Zero-Trust Architecture</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Trust no one, verify everything. We implement strict identity controls for every access request.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center mt-12 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4">Ready to secure your property?</h2>
                        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                            Get a free security audit and infrastructure assessment today.
                        </p>
                        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors">
                            Contact Sales
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
};

// Helper for the icon map fix above - not strictly needed if we just use CheckCircle for all list items as per design
const checkCircleIcon = CheckCircle2;

export default ITSecurity;
