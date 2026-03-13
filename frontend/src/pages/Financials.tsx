import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase'; // Direct supabase usage for transaction fetching
import { Button } from '../components/UIComponents';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

type Timeframe = '30days' | 'ytd' | 'all';

// Colors for charts
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const Financials: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('30days');

  useEffect(() => {
    if (user?.propertyId) {
      fetchFinancialData();
    }
  }, [user?.propertyId]);

  const fetchFinancialData = async () => {
    try {
      // 1. Fetch Payments (Income) with relations
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
            *,
            reservations:res_id (
              rooms:room_id (number, type),
              guests:guest_id (first_name, last_name)
            )
          `)
        .eq('property_id', user?.propertyId)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // 2. Fetch Expenses (Financial Transactions)
      const { data: expenseData, error: expenseError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('property_id', user?.propertyId)
        .order('processed_at', { ascending: false });

      if (expenseError) throw expenseError;

      // 3. Merge into unified transaction list
      const incomeTransactions: Transaction[] = (paymentsData || []).map((p: any) => {
        const guest = p.reservations?.guests;
        const room = p.reservations?.rooms;
        const guestName = guest ? `${guest.first_name} ${guest.last_name}` : 'Unknown Guest';
        const roomInfo = room ? `Room ${room.number} (${room.type})` : 'Unknown Room';

        return {
          id: p.id,
          type: 'Income',
          category: 'Payment',
          amount: Number(p.amount) || 0,
          description: `Payment (${p.method}) - ${guestName} - ${roomInfo}${p.notes ? ` - ${p.notes}` : ''}`,
          processed_at: p.created_at,
          property_id: p.property_id
        };
      });

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

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const date = new Date(t.processed_at);
      if (timeframe === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= thirtyDaysAgo;
      } else if (timeframe === 'ytd') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return date >= startOfYear;
      }
      return true; // 'all'
    });
  }, [transactions, timeframe]);

  const { revenue, expenses, net } = useMemo(() => {
    const rev = filteredTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const exp = filteredTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    return { revenue: rev, expenses: exp, net: rev - exp };
  }, [filteredTransactions]);

  // Generate data for Area Chart (Trend)
  const trendData = useMemo(() => {
    // Group by date (YYYY-MM-DD)
    const grouped = filteredTransactions.reduce((acc: any, t) => {
      const date = new Date(t.processed_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, Income: 0, Expense: 0 };
      }
      acc[date][t.type] += t.amount;
      return acc;
    }, {});

    // Convert to sorted array
    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTransactions]);

  // Generate data for Pie Charts (Category Breakdown)
  const categoryData = useMemo(() => {
    const incomeCategories: any = {};
    const expenseCategories: any = {};

    filteredTransactions.forEach(t => {
      if (t.type === 'Income') {
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + t.amount;
      } else {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
      }
    });

    const formatForPie = (dataMap: any) =>
      Object.entries(dataMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => (b.value as number) - (a.value as number));

    return {
      income: formatForPie(incomeCategories),
      expense: formatForPie(expenseCategories)
    };
  }, [filteredTransactions]);

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Property ID'];
    const rows = filteredTransactions.map(t => [
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
    link.setAttribute("download", `financial_report_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltipArea = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded shadow-lg text-sm">
          <p className="font-semibold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-600">{entry.name}:</span>
              <span className="font-medium">${Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipPie = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-slate-200 rounded shadow text-sm">
          <p className="font-semibold text-slate-700">{payload[0].name}</p>
          <p className="text-slate-600">${Number(payload[0].value).toFixed(2)}</p>
        </div>
      );
    }
    return null;
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
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
            className="border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white px-4 py-2 text-sm font-medium text-slate-700 outline-none border"
          >
            <option value="30days">Last 30 Days</option>
            <option value="ytd">Year to Date (YTD)</option>
            <option value="all">All Time</option>
          </select>
          <Button onClick={exportToCSV} icon={Download} className="bg-slate-900 text-white hover:bg-slate-800">
            Export Report
          </Button>
        </div>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Cash Flow Trend</h2>
          <div className="h-[300px] w-full mt-auto mb-auto">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <RechartsTooltip content={<CustomTooltipArea />} />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No trend data available for this period.</div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Income by Category</h2>
          <div className="h-[250px] w-full flex-grow flex items-center justify-center">
            {categoryData.income.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.income}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.income.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltipPie />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No income data available.</div>
            )}
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
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 50).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(t.processed_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No transactions found for the selected timeframe.
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