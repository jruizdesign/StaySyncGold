
import { Sparkles, AlertTriangle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

interface AIInsightCardProps {
    title?: string;
    subtitle?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'success' | 'alert';
    loading?: boolean;
    error?: boolean;
    timestamp?: string;
}

export const AIInsightCard = ({
    title = "Operational Intel", subtitle = "Financial And Property Analysis", message = "Unable to generate AI brief. Please check manual Arrears and Maintenance logs below.", actionLabel = "Review open maintenance tickets.", onAction, variant = 'default', loading = false, error, timestamp
}: AIInsightCardProps) => {
    // Determine styles based on variant
    const variantStyles = {
        default: {
            bg: 'bg-[#0B1120]',
            border: 'border-slate-800',
            iconBg: 'bg-blue-600/20',
            iconColor: 'text-blue-400',
            subtitleColor: 'text-blue-400',
            buttonBg: 'bg-blue-900/50 hover:bg-blue-900/70',
            buttonBorder: 'border-blue-800/50 hover:border-blue-700',
            buttonText: 'text-blue-200',
            buttonIcon: 'text-blue-400',
            accentColor: 'text-blue-500'
        },
        alert: {
            bg: 'bg-[#1a0f0f]',
            border: 'border-red-900/30',
            iconBg: 'bg-red-600/20',
            iconColor: 'text-red-400',
            subtitleColor: 'text-red-400',
            buttonBg: 'bg-red-900/30 hover:bg-red-900/50',
            buttonBorder: 'border-red-800/30 hover:border-red-700',
            buttonText: 'text-red-200',
            buttonIcon: 'text-red-400',
            accentColor: 'text-red-500'
        },
        success: {
            bg: 'bg-[#0f1a15]',
            border: 'border-emerald-900/30',
            iconBg: 'bg-emerald-600/20',
            iconColor: 'text-emerald-400',
            subtitleColor: 'text-emerald-400',
            buttonBg: 'bg-emerald-900/30 hover:bg-emerald-900/50',
            buttonBorder: 'border-emerald-800/30 hover:border-emerald-700',
            buttonText: 'text-emerald-200',
            buttonIcon: 'text-emerald-400',
            accentColor: 'text-emerald-500'
        }
    };

    const styles = variantStyles[variant] || variantStyles.default;

    return (
        <div className={`w-full ${styles.bg} rounded-3xl p-8 relative overflow-hidden shadow-2xl border ${styles.border} transition-colors duration-500`}>
            {/* Background decoration */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                {variant === 'success' ? (
                    <CheckCircle2 className="w-64 h-64 text-white" />
                ) : (
                    <AlertTriangle className="w-64 h-64 text-white" />
                )}
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className={`p-2.5 ${styles.iconBg} rounded-xl`}>
                        {loading ? (
                            <Loader2 className={`w-6 h-6 ${styles.iconColor} animate-spin`} />
                        ) : (
                            <Sparkles className={`w-6 h-6 ${styles.iconColor}`} />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h3 className="text-white font-bold text-lg tracking-wide">{title}</h3>
                            {timestamp && !loading && (
                                <span className="text-xs text-slate-500 font-mono">
                                    {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                        <p className={`${styles.subtitleColor} text-xs font-bold tracking-widest uppercase mt-1`}>
                            {loading ? 'ANALYZING PROPERTY DATA...' : subtitle}
                        </p>
                    </div>
                </div>

                {/* Message */}
                <div className="mb-8 min-h-[60px]">
                    {loading ? (
                        <div className="space-y-3 animate-pulse opacity-50">
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                        </div>
                    ) : (
                        <p className="text-slate-300 text-xl font-light italic leading-relaxed">
                            "{message}"
                        </p>
                    )}
                </div>

                {/* Action & Footer */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    {!loading && actionLabel && (
                        <button
                            onClick={onAction}
                            className={`group flex items-center gap-3 ${styles.buttonBg} ${styles.buttonBorder} border transition-all rounded-xl px-4 py-3 text-left`}
                        >
                            <AlertTriangle className={`w-5 h-5 ${styles.buttonIcon}`} />
                            <div>
                                <p className={`${styles.accentColor} text-[10px] font-bold uppercase tracking-wider mb-0.5`}>Manager Action Item</p>
                                <p className={`${styles.buttonText} font-medium text-sm group-hover:text-white transition-colors`}>
                                    {actionLabel}
                                </p>
                            </div>
                            <ArrowRight className={`w-4 h-4 ${styles.buttonIcon} opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all ml-2`} />
                        </button>
                    )}

                    <div className="flex items-center gap-2 opacity-40 ml-auto">
                        <Sparkles className="w-3 h-3 text-white" />
                        <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">
                            Powered by Gemini 3 Pro
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
