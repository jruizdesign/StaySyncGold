import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, CheckCircle2, Sparkles, LayoutDashboard, BedDouble, BrainCircuit } from 'lucide-react';
import { Button } from '../components/UIComponents';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden font-sans selection:bg-gold-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gold-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                        <span className="text-xl font-bold tracking-tight">STAYSYNC<span className="text-slate-400 font-light">OS</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <button onClick={() => navigate('/digital-solutions')} className="hover:text-white transition-colors">Digital Solutions</button>
                        <button onClick={() => navigate('/it-security')} className="hover:text-white transition-colors">IT & Security</button>
                        <a href="#" className="hover:text-white transition-colors">Features</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-slate-300 hover:text-white font-medium text-sm transition-colors"
                        >
                            Login to Property
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-white text-slate-900 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-slate-100 transition-colors"
                        >
                            Launch Demo
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-900/10 border border-gold-700/50 text-gold-400 text-xs font-semibold tracking-wide mb-8 animate-fadeIn">
                    <Sparkles className="w-3 h-3" />
                    NEW: GEMINI 3.0 INTEGRATION
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.1]">
                    The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-200">Modern Hospitality</span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
                    Unify bookings, staff management, and maintenance into one intelligent platform.
                    Secured by Firebase, Powered by Google Cloud.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-20">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center justify-center gap-2 bg-gold-600 hover:bg-gold-500 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                    >
                        Start Live Trial
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-3.5 rounded-lg font-semibold text-lg transition-all"
                    >
                        <ArrowRight className="w-4 h-4" />
                        Login to Property
                    </button>
                </div>

                {/* Dashboard Mockup */}
                <div className="relative w-full max-w-5xl mx-auto perspective-1000">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gold-500/10 blur-[100px] -z-10 rounded-full opacity-50 pointer-events-none" />

                    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10 transform rotate-x-2 transition-transform duration-500 hover:rotate-x-0">
                        {/* Browser Header */}
                        <div className="h-10 bg-[#1e293b] border-b border-slate-700 flex items-center px-4 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="flex-1 text-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0f172a] border border-slate-700 text-[10px] text-slate-400 font-mono">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    https://app.staysyncos.com/dashboard/
                                </div>
                            </div>
                        </div>

                        {/* App Content Preview */}
                        <div className="p-6 grid grid-cols-12 gap-6 text-left h-[500px] bg-[#0f172a] relative">
                            {/* Fake Sidebar */}
                            <div className="col-span-3 space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 group cursor-pointer hover:border-gold-500/50 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-slate-700 rounded-lg group-hover:bg-gold-500/20 group-hover:text-gold-400 transition-colors">
                                            <BrainCircuit className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-slate-200">AI Operations</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Real-time revenue tracking and Gemini AI-powered operational insights.</p>
                                </div>

                                <div className="p-4 bg-gold-900/10 rounded-lg border border-gold-500/50 cursor-pointer">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-gold-600 rounded-lg text-white">
                                            <BedDouble className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-white">Live Inventory</span>
                                    </div>
                                    <p className="text-xs text-gold-200/70">Visual room grid with one-click status updates for housekeeping.</p>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="col-span-9 bg-[#1e293b]/50 rounded-xl border border-slate-800 p-6">
                                <h3 className="text-2xl font-bold text-white mb-1">Room Management</h3>
                                <p className="text-slate-400 text-sm mb-6">Monitor room readiness and occupancy at a glance.</p>

                                <div className="flex gap-4 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Search room number or guest..."
                                        className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
                                        readOnly
                                    />
                                    <div className="w-10 h-10 rounded-lg bg-[#0f172a] border border-slate-700 flex items-center justify-center text-slate-400">
                                        <LayoutDashboard className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Placeholder Grid */}
                                <div className="grid grid-cols-4 gap-4 opacity-50 mask-gradient-to-b">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="h-24 bg-[#0f172a] border border-slate-700 rounded-lg p-3 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <span className="text-slate-500 text-xs font-bold">10{i + 1}</span>
                                                <div className={`w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </div>
                                            <div className="h-2 w-12 bg-slate-700 rounded-full" />
                                        </div>
                                    ))}
                                </div>

                                {/* Feature Spotlight Tooltip */}
                                <div className="absolute top-1/3 right-10 bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-slate-600 max-w-xs animate-bounce-slow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-gold-400" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Feature Spotlight</span>
                                    </div>
                                    <p className="text-sm font-medium">Interactive grid with drag-and-drop status changes.</p>
                                    <div className="absolute -bottom-2 right-8 w-4 h-4 bg-slate-800 border-r border-b border-slate-600 transform rotate-45" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} StaySync Gold. All rights reserved.</p>
                <p className="mt-2 text-xs">Architected by <a href="https://twitter.com/jruizdesign" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-gold-400 transition-colors">Jason Ruiz @jruizdesign</a></p>
            </footer>
        </div>
    );
};

export default LandingPage;
