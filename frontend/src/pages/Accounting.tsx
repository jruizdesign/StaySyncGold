import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/accounting/MetricCard';
import { GuestLedgerTable } from '../components/accounting/GuestLedgerTable';
import { LedgerTable } from '../components/accounting/LedgerTable';
import { FinancialInsightCard } from '../components/accounting/FinancialInsightCard';
import { DebtItem, LedgerEntry, DailyFinancialData } from '../types/accounting';
import { ShieldAlert, Download } from 'lucide-react';

const API_BASE = `${API_BASE_URL}/api`;

const Accounting: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'guest_ledger' | 'transactions'>('overview');
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

    const [overview, setOverview] = useState<DailyFinancialData | null>(null);
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [briefing, setBriefing] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.propertyId) return;
        setIsEnabled(true);

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const headers = { 'Content-Type': 'application/json' };

                const overviewRes = await fetch(`${API_BASE}/accounting/overview?property_id=${user.propertyId}`, { headers });
                if (overviewRes.status === 403) {
                    setIsEnabled(false);
                    return;
                }
                const overviewData = await overviewRes.json();
                setOverview(overviewData);
                if (overviewData.aiBriefing) setBriefing(overviewData.aiBriefing);

                const dailyRes = await fetch(`${API_BASE}/accounting/daily?property_id=${user.propertyId}`, { headers });
                const dailyData = await dailyRes.json();
                setDebts(dailyData);

                const ledgerRes = await fetch(`${API_BASE}/accounting/ledger?property_id=${user.propertyId}`, { headers });
                const ledgerData = await ledgerRes.json();
                setLedger(ledgerData);

            } catch (error) {
                console.error("Failed to load accounting data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.propertyId]);

    if (isEnabled === false) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <ShieldAlert size={48} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-600">Accounting Module Disabled</h2>
                <p>Please contact your administrator to enable this feature.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Financial Management</h1>
                    <p className="text-slate-500">Track revenue, expenses, and guest billing</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm">
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'overview'
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Overview
                    {activeTab === 'overview' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('guest_ledger')}
                    className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'guest_ledger'
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Guest Ledger (Due)
                    {activeTab === 'guest_ledger' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'transactions'
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    All Transactions
                    {activeTab === 'transactions' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900 rounded-t-full" />
                    )}
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard stat={{
                            label: 'Total Income', // Mapped from Revenue YTD
                            value: overview?.revenueYTD || 0,
                            type: 'currency',
                            trend: 12, // Mock trend
                            color: 'bg-emerald-50 text-emerald-600'
                        }} />
                        <MetricCard stat={{
                            label: 'Total Expenses', // Placeholder
                            value: 0,
                            type: 'currency',
                            trend: -5,
                            color: 'bg-rose-50 text-rose-600'
                        }} />
                        <MetricCard stat={{
                            label: 'Net Profit', // Income - Expenses
                            value: (overview?.revenueYTD || 0),
                            type: 'currency',
                            color: 'bg-slate-50 text-slate-900'
                        }} />
                        <MetricCard stat={{
                            label: 'Pending Collections', // Receivables
                            value: overview?.receivables || 0,
                            type: 'currency',
                            color: 'bg-amber-50 text-amber-600'
                        }} />
                    </div>

                    {/* AI Insights & Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-5 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-900">Recent Financial Activity</h3>
                                </div>
                                <div className="h-[300px]">
                                    {/* Reuse LedgerTable but limiting rows or simplified view. Using full LedgerTable for now but maybe truncated via props if we had them. */}
                                    <LedgerTable entries={ledger.slice(0, 5)} isLoading={isLoading} />
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <FinancialInsightCard briefing={briefing} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'guest_ledger' && (
                <GuestLedgerTable items={debts} isLoading={isLoading} />
            )}

            {activeTab === 'transactions' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-1">
                    <LedgerTable entries={ledger} isLoading={isLoading} />
                </div>
            )}
        </div>
    );
};

export default Accounting;
