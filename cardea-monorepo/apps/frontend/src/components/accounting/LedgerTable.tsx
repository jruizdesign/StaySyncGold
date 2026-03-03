import React, { useState } from 'react';
import { LedgerEntry } from '../../types/accounting';
import { Search, Filter, Download } from 'lucide-react';

interface LedgerTableProps {
    entries: LedgerEntry[];
    isLoading: boolean;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ entries, isLoading }) => {
    const [filter, setFilter] = useState('');

    const filteredEntries = entries.filter(e =>
        e.guest_name?.toLowerCase().includes(filter.toLowerCase()) ||
        e.id.toLowerCase().includes(filter.toLowerCase())
    );

    if (isLoading) return <div className="p-12 text-center text-slate-400">Loading ledger...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search booking ID, guest name..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Tx ID / Booking</th>
                            <th className="px-6 py-3 font-medium">Guest</th>
                            <th className="px-6 py-3 font-medium">Room</th>
                            <th className="px-6 py-3 font-medium text-right">Amount</th>
                            <th className="px-6 py-3 font-medium text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3 text-slate-500">
                                    {entry.arrival_date ? new Date(entry.arrival_date).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-3 font-mono text-xs text-slate-400">{entry.id.substring(0, 8)}</td>
                                <td className="px-6 py-3 font-medium text-slate-900">{entry.guest_name}</td>
                                <td className="px-6 py-3 text-slate-600">{entry.room_type}</td>
                                <td className="px-6 py-3 text-right font-medium text-slate-900">
                                    ${parseFloat(String(entry.total_price)).toLocaleString()}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${entry.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                            entry.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                                                'bg-blue-100 text-blue-700'
                                        }`}>
                                        {entry.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-400">
                Showing {filteredEntries.length} entries (Immutable Ledger View)
            </div>
        </div>
    );
};
