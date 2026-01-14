import React, { useState, useMemo } from 'react';
import { Calendar, Printer, DollarSign, Wallet, TrendingUp, CreditCard } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '../constants';

const Financials: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2024-05-20'); // Default to date with mock data

  // Helper to format date for header (e.g., "Tuesday, January 13, 2026")
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate totals based on mock transactions
  const stats = useMemo(() => {
    const totalCollected = MOCK_TRANSACTIONS
      .filter(t => t.type === 'Credit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Mock logic for other KPIs since we only have transactions
    const outstanding = 1250;
    const dailyAccrued = totalCollected * 0.8;
    const projected = totalCollected * 1.5;

    return { totalCollected, outstanding, dailyAccrued, projected };
  }, []);

  // Filter transactions for the table (showing all for demo purposes if date matches or empty)
  const dailyTransactions = MOCK_TRANSACTIONS.filter(t => t.date === selectedDate);

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Daily Financial Record</h1>
          </div>
          <p className="text-slate-500 text-sm">Day-at-a-glance view of collections and guest balances.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              className="pl-4 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors shadow-sm">
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500">Total Collected</p>
              <p className="text-4xl font-bold text-emerald-600 mt-2">${stats.totalCollected.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Cash/card received on this date</p>
        </div>

        {/* Outstanding Balances */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500">Outstanding Balances</p>
              <p className="text-4xl font-bold text-rose-500 mt-2">${stats.outstanding.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Total amount owed by active guests</p>
        </div>

        {/* Daily Accrued */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500">Daily Accrued</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">${stats.dailyAccrued.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Revenue from today's stays</p>
        </div>

        {/* Projected Revenue */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500">Projected Revenue</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">${stats.projected.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Total expected from current stays</p>
        </div>
      </div>

      {/* Room Details Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Room Details - {formatDate(selectedDate)}</h3>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-800 bg-slate-50/50 uppercase font-bold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyTransactions.length > 0 ? (
                dailyTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 border-l-4 border-l-transparent hover:border-l-gold-500">{t.description}</td>
                    <td className="px-6 py-4 text-slate-600">{t.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'Credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ${t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-400 uppercase font-bold">
                      Completed
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    No activity found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Financials;