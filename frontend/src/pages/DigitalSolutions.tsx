import { useNavigate } from 'react-router-dom';
import {
    Code2,
    Cloud,
    ShieldCheck,
    ArrowRight
} from 'lucide-react';


const DigitalSolutions: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden font-sans selection:bg-indigo-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                        <span className="text-xl font-bold tracking-tight">StaySync<span className="text-indigo-500">Digital</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="/" className="hover:text-white transition-colors">Home</a>
                        <button onClick={() => navigate('/it-security')} className="hover:text-white transition-colors">IT & Cybersecurity</button>
                        <button className="text-white transition-colors">Digital Solutions</button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Client Portal
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-5xl leading-[1.1]">
                    Empowering Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-200">Digital Future</span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
                    We provide cutting-edge technology solutions to transform your business.
                    From custom software to enterprise-grade cybersecurity, we build the infrastructure for your growth.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-fadeIn">
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-lg font-semibold text-lg transition-all shadow-lg shadow-indigo-500/20">
                        View IT Solutions
                    </button>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-8 py-3.5 rounded-lg font-semibold text-lg transition-all">
                        Schedule Consultation
                    </button>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-8 text-left">
                    {/* Software Development */}
                    <div className="bg-[#0f172a] rounded-2xl p-8 border border-slate-800 hover:border-indigo-500/50 transition-all group">
                        <div className="w-12 h-12 bg-[#1e293b] rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                            <Code2 className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Software Development</h3>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Custom applications tailored to your specific business needs. We build scalable, high-performance web and mobile solutions.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['React', 'Node.js', 'Mobile Apps'].map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <button className="text-indigo-400 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Cloud Integration */}
                    <div className="bg-[#0f172a] rounded-2xl p-8 border border-slate-800 hover:border-indigo-500/50 transition-all group">
                        <div className="w-12 h-12 bg-[#1e293b] rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                            <Cloud className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-white">Cloud Integration</h3>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Seamless migration and management of cloud infrastructure. We optimize your stack for speed, reliability, and cost-efficiency.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['AWS', 'Azure', 'Google Cloud'].map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <button className="text-indigo-400 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* IT & Cybersecurity */}
                    <div className="bg-[#0f172a] rounded-2xl p-8 border border-slate-800 hover:border-indigo-500/50 transition-all group cursor-pointer" onClick={() => navigate('/it-security')}>
                        <div className="w-12 h-12 bg-[#1e293b] rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                            <ShieldCheck className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-white">IT & Cybersecurity</h3>
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Protect your digital assets with our enterprise-grade security protocols, real-time monitoring, and compliance management.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['Network Security', 'Audits', '24/7 Monitoring'].map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <button className="text-indigo-400 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                            Learn more <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="w-full bg-[#020617] border-t border-slate-800 mt-32 py-16">
                    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                            <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">Uptime Guaranteed</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">200+</div>
                            <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">Global Clients</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">Weekly</div>
                            <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">Security Audits</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">24/7</div>
                            <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">Support</div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default DigitalSolutions;
