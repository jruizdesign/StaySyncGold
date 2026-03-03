import React from 'react';
import { DebtItem } from '../../types/accounting';
import { BadgeCheck, Clock, AlertCircle } from 'lucide-react';

interface GuestLedgerTableProps {
    items: DebtItem[];
    isLoading: boolean;
}

export const GuestLedgerTable: React.FC<GuestLedgerTableProps> = ({ items, isLoading }) => {
    if (isLoading) return <div className="p-8 text-center text-slate-400">Loading guest ledger...</div>;

    const totalDue = items.reduce((sum, item) => sum + item.balance, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Guest Ledger</h3>
                    <p className="text-sm text-slate-500">Daily breakdown of amounts due from guests</p>
                </div>
                <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center shadow-sm border border-amber-100">
                    Total Due: ${totalDue.toLocaleString()}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Guest</th>
                            <th className="px-6 py-4">Room</th>
                            <th className="px-6 py-4">Status</th>
                            {/* Daily Rate is not in DebtItem yet, assuming aggregated balance. Placeholder for now or mapped */}
                            <th className="px-6 py-4">Balance Breakdown</th>
                            <th className="px-6 py-4 text-right">Current Due</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No outstanding balances found.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {item.guestName}
                                        {item.score <= 2 && (
                                            <span className="ml-2 inline-flex items-center text-xs text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                                <AlertCircle size={10} className="mr-1" /> Priority
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.room}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.status === 'checked_in' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            item.status === 'checked_out' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                                'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {item.status === 'checked_in' && <BadgeCheck size={12} />}
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {/* Placeholder logic for 'Daily Rate' since we track total balance */}
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> checkout: {new Date(item.checkout).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                        ${item.balance.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                                            View Folio
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
