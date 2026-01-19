import React from 'react';
import { User } from 'lucide-react';
import { Staff } from '../types';

interface StaffCardProps {
    staff: Staff;
    onClick: () => void;
    status?: 'active' | 'on_break' | 'idle';
}

const StaffCard: React.FC<StaffCardProps> = ({ staff, onClick, status = 'idle' }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'active': return 'bg-emerald-500 shadow-emerald-500/50';
            case 'on_break': return 'bg-amber-500 shadow-amber-500/50';
            default: return 'bg-slate-300';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'active': return 'Clocked In';
            case 'on_break': return 'On Break';
            default: return 'Off Duty';
        }
    };

    return (
        <button
            onClick={onClick}
            className="relative group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left w-full border border-slate-100 hover:border-gold-200"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-gold-50 transition-colors">
                    <User className="w-8 h-8 text-slate-400 group-hover:text-gold-500 transition-colors" />
                </div>
                <div className={`w-3 h-3 rounded-full shadow-lg ${getStatusColor()}`} />
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-gold-600 transition-colors">
                    {staff.name}
                </h3>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-slate-500">{staff.role}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm`}>
                        {getStatusText()}
                    </span>
                </div>
            </div>
        </button>
    );
};

export default StaffCard;
