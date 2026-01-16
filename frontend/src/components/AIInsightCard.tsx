import React from 'react';
import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface AIInsightCardProps {
    title?: string;
    subtitle?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'alert' | 'success';
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
    title = "Lumina Operational Intel",
    subtitle = "ARREARS & MAINTENANCE ANALYSIS",
    message = "Unable to generate AI brief. Please check manual Arrears and Maintenance logs below.",
    actionLabel = "Review open maintenance tickets.",
    onAction,
    variant = 'alert'
}) => {
    return (
        <div className="w-full bg-[#0B1120] rounded-3xl p-8 relative overflow-hidden shadow-2xl border border-slate-800">
            {/* Background decoration */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <AlertTriangle className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-2.5 bg-blue-600/20 rounded-xl">
                        <Sparkles className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg tracking-wide">{title}</h3>
                        <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mt-1">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Message */}
                <div className="mb-8">
                    <p className="text-slate-300 text-xl font-light italic leading-relaxed">
                        "{message}"
                    </p>
                </div>

                {/* Action & Footer */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    {actionLabel && (
                        <button
                            onClick={onAction}
                            className="group flex items-center gap-3 bg-blue-900/50 hover:bg-blue-900/70 border border-blue-800/50 hover:border-blue-700 transition-all rounded-xl px-4 py-3 text-left"
                        >
                            <AlertTriangle className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="text-blue-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Manager Action Item</p>
                                <p className="text-blue-200 font-medium text-sm group-hover:text-white transition-colors">
                                    {actionLabel}
                                </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all ml-2" />
                        </button>
                    )}

                    <div className="flex items-center gap-2 opacity-40">
                        <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">
                            Powered by Gemini 3 Pro
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
