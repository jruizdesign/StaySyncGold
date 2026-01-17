import React from 'react';
import { DebtItem } from '../../types/accounting';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface DebtPriorityListProps {
    items: DebtItem[];
    isLoading: boolean;
}

export const DebtPriorityList: React.FC<DebtPriorityListProps> = ({ items, isLoading }) => {
    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading debt priority...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="text-rose-500 w-5 h-5" />
                    Debt Priority Action List
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                    {items.filter(i => i.score >= 100).length} Critical Actions
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">No outstanding debts requiring action.</div>
                ) : items.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full ${item.score >= 500 ? 'bg-rose-500 animate-pulse' :
                                    item.score >= 100 ? 'bg-orange-500' : 'bg-yellow-500'
                                }`} />

                            <div>
                                <p className="font-medium text-slate-900">{item.guestName}</p>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                    <span className="font-mono text-slate-600 bg-slate-100 px-1.5 rounded text-xs">{item.room}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        Checkout: {new Date(item.checkout).toLocaleDateString()}
                                    </span>
                                </div>
                                {item.priorityLabel && (
                                    <span className="inline-block mt-2 text-[10px] uppercase tracking-wider font-bold text-rose-600">
                                        {item.priorityLabel}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-slate-900">${item.balance.toLocaleString()}</div>
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Collect Payment →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
