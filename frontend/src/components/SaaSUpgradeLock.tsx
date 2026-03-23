import React from 'react';
import { ShieldAlert, Briefcase, Zap, CreditCard, ChevronRight } from 'lucide-react';
import { Button, Badge } from './UIComponents';

interface SaaSUpgradeLockProps {
    moduleName: string;
    description: string;
    icon?: 'finance' | 'quickbooks' | 'payments' | 'channel' | 'default';
}

export const SaaSUpgradeLock: React.FC<SaaSUpgradeLockProps> = ({ moduleName, description, icon = 'default' }) => {
    const getIcon = () => {
        switch (icon) {
            case 'finance': return <Briefcase className="w-12 h-12 text-blue-500" />;
            case 'quickbooks': return <Zap className="w-12 h-12 text-green-500" />;
            case 'payments': return <CreditCard className="w-12 h-12 text-indigo-500" />;
            case 'channel': return <ShieldAlert className="w-12 h-12 text-amber-500" />;
            default: return <ShieldAlert className="w-12 h-12 text-slate-400" />;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center animate-fadeIn">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 border border-slate-100">
                {getIcon()}
            </div>
            
            <div className="uppercase tracking-wider text-xs mb-3 font-bold">
                <Badge color="yellow">Premium Feature Locked</Badge>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{moduleName}</h2>
            <p className="text-slate-500 max-w-lg mx-auto mb-8 text-lg">
                Your current property plan does not include access to {moduleName}. {description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg px-8 py-3">
                    Upgrade to Premium
                </Button>
                <Button variant="outline" className="text-slate-600 bg-white hover:bg-slate-50 border-slate-300">
                    Contact Sales team
                </Button>
            </div>
            
            <div className="mt-12 text-sm text-slate-400 border-t border-slate-200 pt-6 w-full max-w-lg flex flex-col items-center">
                <span className="flex items-center gap-2 cursor-pointer hover:text-slate-600 transition-colors">
                    Learn more about our Enterprise Tiers <ChevronRight size={16} />
                </span>
            </div>
        </div>
    );
};
