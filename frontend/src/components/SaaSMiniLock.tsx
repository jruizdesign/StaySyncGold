import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock } from 'lucide-react';
import { Button } from './UIComponents';

export const SaaSMiniLock: React.FC<{ featureName: string }> = ({ featureName }) => {
    const navigate = useNavigate();
    return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Lock size={120} />
        </div>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100 relative z-10">
            <Sparkles className="w-6 h-6 text-indigo-500" />
        </div>
        <h3 className="font-bold text-slate-800 mb-2 relative z-10">{featureName} Locked</h3>
        <p className="text-xs text-slate-500 mb-4 relative z-10 max-w-[250px]">
            Upgrade your plan to unlock AI-powered insights and automation.
        </p>
        <Button onClick={() => navigate('/pricing')} className="bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 text-xs px-4 py-1.5 relative z-10 h-auto">
            Upgrade Plan
        </Button>
    </div>
    );
};
