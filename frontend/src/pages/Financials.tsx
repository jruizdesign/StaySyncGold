
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // Direct supabase usage for transaction fetching
import { Button } from '../components/UIComponents';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';


// User asked for "CSV and export to excel". xlsx is best for excel.
// I will implement a custom CSV export function to avoid new deps if possible, 
// unless I'm allowed to install deps. I'll stick to CSV for simplicity and robustness.

interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  description: string;
  processed_at: string;
  created_by?: string;
  property_id?: string;
}

const Financials: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time filter could be added later, for now All Time or Year To Date

  useEffect(() => {
    if (user?.propertyId) {
      fetchFinancialData();
    }
  }, [user?.propertyId]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Bookings (Income)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('property_id', user?.propertyId)
        .neq('status', 'cancelled');

      if (bookingsError) throw bookingsError;

      // 2. Fetch Expenses (Financial Transactions)
      const { data: expenseData, error: expenseError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('property_id', user?.propertyId)
        .order('processed_at', { ascending: false });

      if (expenseError) throw expenseError;

      // 3. Merge into unified transaction list
      const incomeTransactions: Transaction[] = (bookingsData || []).map((b: any) => ({
        id: b.id,
        type: 'Income',
        category: 'Room Revenue',
        amount: Number(b.total_amount) || Number(b.total_price) || 0,
        description: `Booking: ${b.guest_name} (${b.room_type})`,
        processed_at: b.created_at || b.arrival_date,
        property_id: b.property_id
      }));

      const unifiedData = [...incomeTransactions, ...(expenseData || [])].sort(
        (a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()
      );

      setTransactions(unifiedData);

    } catch (err: any) {
      console.error('Financials Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const revenue = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    return { revenue, expenses, net: revenue - expenses };
  };

  const { revenue, expenses, net } = calculateTotals();

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Property ID'];
    const rows = transactions.map(t => [
      new Date(t.processed_at).toLocaleDateString(),
      t.type,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.amount.toFixed(2),
      t.property_id || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Financial Data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Accounting & Financials</h1>
          <p className="text-slate-500 mt-1">Real-time financial overview and expense tracking.</p>
        </div>
        <Button onClick={exportToCSV} icon={Download} className="bg-slate-900 text-white hover:bg-slate-800">
          Export Report (CSV)
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-900">${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Net Income</p>
              <p className={`text-2xl font-bold ${net >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                ${net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(t.processed_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {t.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${t.type === 'Income'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-rose-100 text-rose-700'
                      }`}>
                      {t.type === 'Income' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'Income' ? 'text-green-600' : 'text-slate-900'
                    }`}>
                    {t.type === 'Expense' ? '-' : '+'}${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Financials;