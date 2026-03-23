import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { SaaSMiniLock } from '../SaaSMiniLock';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface FinancialInsightCardProps {
    briefing: string;
    isLoading: boolean;
}

export const FinancialInsightCard: React.FC<FinancialInsightCardProps> = ({ briefing, isLoading }) => {
    const { user } = useAuth();
    const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        const checkFeat = async () => {
            if (user?.propertyId) {
                const { data } = await supabase.from('properties').select('enable_ai').eq('id', user.propertyId).single();
                setAiEnabled(!!data?.enable_ai);
            }
        };
        checkFeat();
    }, [user?.propertyId]);

    if (aiEnabled === false) {
        return <SaaSMiniLock featureName="Financial AI Briefing" />;
    }
    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={100} />
            </div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="p-1.5 bg-indigo-500/20 rounded-md border border-indigo-400/30">
                    <Sparkles size={18} className="text-indigo-300" />
                </div>
                <h3 className="font-semibold text-indigo-100 tracking-wide text-sm uppercase">AI Financial Briefing</h3>
                <span className="ml-auto text-[10px] bg-indigo-500/30 px-2 py-0.5 rounded text-indigo-200 border border-indigo-500/30">
                    Gemini 3 Flash
                </span>
            </div>

            <div className="relative z-10 min-h-[120px]">
                {isLoading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-indigo-500/30 rounded w-3/4"></div>
                        <div className="h-4 bg-indigo-500/20 rounded w-1/2"></div>
                        <div className="h-4 bg-indigo-500/10 rounded w-5/6"></div>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-indigo-50/90 leading-relaxed font-light">
                        {/* Rendering plain text with bolding support if ReactMarkdown not available */}
                        <div className="whitespace-pre-wrap font-sans text-sm">
                            {briefing.split('\n').map((line, i) => {
                                if (line.includes('**')) {
                                    const parts = line.split('**');
                                    return (
                                        <p key={i} className="mb-2">
                                            {parts.map((part, idx) => (idx % 2 === 1 ? <strong key={idx} className="text-white font-semibold">{part}</strong> : part))}
                                        </p>
                                    );
                                }
                                return <p key={i} className="mb-1">{line}</p>;
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-indigo-500/20 flex gap-4 text-xs text-indigo-300">
                <span className="flex items-center gap-1">
                    <TrendingUp size={12} /> Revenue Focused
                </span>
                <span className="flex items-center gap-1">
                    <AlertTriangle size={12} /> Risk Analysis
                </span>
            </div>
        </div>
    );
};
