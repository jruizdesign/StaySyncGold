import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MetricCard } from '../components/accounting/MetricCard';
import { DebtPriorityList } from '../components/accounting/DebtPriorityList';
import { LedgerTable } from '../components/accounting/LedgerTable';
import { FinancialInsightCard } from '../components/accounting/FinancialInsightCard';
import { AccountingStat, DebtItem, LedgerEntry, DailyFinancialData } from '../types/accounting';
import { DollarSign, ShieldAlert } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Accounting: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger'>('dashboard');
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null); // Null = loading check

    const [overview, setOverview] = useState<DailyFinancialData | null>(null);
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [briefing, setBriefing] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.propertyId) return;

        // 1. Check Feature Flag (Simulated or fetched)
        // Ideally this comes from AuthContext user object if we updated AppUser type, 
        // but for now we'll fetch from API or assume true if not forbidden.
        // Actually, the backend blocks it, so if we get 403, we know it's disabled.
        setIsEnabled(true);

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const headers = { 'Content-Type': 'application/json' }; // Add auth headers if needed

                // A. Overview
                const overviewRes = await fetch(`${API_BASE}/accounting/overview?property_id=${user.propertyId}`, { headers });
                if (overviewRes.status === 403) {
                    setIsEnabled(false);
                    return;
                }
                const overviewData = await overviewRes.json();
                setOverview(overviewData);
                if (overviewData.aiBriefing) {
                    setBriefing(overviewData.aiBriefing);
                }

                // B. Daily / Debts
                const dailyRes = await fetch(`${API_BASE}/accounting/daily?property_id=${user.propertyId}`, { headers });
                const dailyData = await dailyRes.json();
                setDebts(dailyData);

                // C. Ledger
                const ledgerRes = await fetch(`${API_BASE}/accounting/ledger?property_id=${user.propertyId}`, { headers });
                const ledgerData = await ledgerRes.json();
                setLedger(ledgerData);

                // D. AI Briefing
                // We'll call a service method ideally, but direct ID linkage here:
                // Assuming we want to feed "Daily Data" to the AI endpoint? 
                // Or does the AI service have its own endpoint?
                // Plan: I didn't create a specific route for "generateFinancialBriefing" in accounting router.
                // It should be part of the Daily fetch or a separate AI call.
                // Let's assume for now we use the `dailyData` and generate it client-side? No, AI key is backend.
                // I need to add a route for briefing! 
                // I'll skip fetching briefing for this specific render until I add the route.
                // Wait, I can add it to the 'overview' response? 
                // Let's assume mock briefing for now or add the endpoint quickly.

                // Temporary Mock for Demo until Endpoint added
                // Mock removed, data comes from overview endpoint


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
            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Financial Command Center</h1>
                    <p className="text-slate-500">Real-time financial health and ledger.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        General Ledger
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <div className="space-y-6">
                    {/* Top Row: Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard stat={{
                            label: 'Total Receivables',
                            value: overview?.receivables || 0,
                            type: 'currency',
                            color: 'bg-rose-100 text-rose-600'
                        }} />
                        <MetricCard stat={{
                            label: 'Revenue YTD',
                            value: overview?.revenueYTD || 0,
                            type: 'currency',
                            trend: 12,
                            color: 'bg-emerald-100 text-emerald-600'
                        }} />
                        <MetricCard stat={{
                            label: 'Projected Revenue',
                            value: overview?.projectedInput || 0,
                            type: 'currency',
                            color: 'bg-blue-100 text-blue-600'
                        }} />
                        <MetricCard stat={{
                            label: 'Efficiency Score',
                            value: overview?.occupancyEfficiency || 0,
                            type: 'percent',
                            color: 'bg-purple-100 text-purple-600'
                        }} />
                    </div>

                    {/* Middle Row: AI & Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Actions (2/3 width) */}
                        <div className="lg:col-span-2">
                            <DebtPriorityList items={debts} isLoading={isLoading} />
                        </div>

                        {/* AI Briefing (1/3 width) */}
                        <div className="lg:col-span-1">
                            <FinancialInsightCard briefing={briefing} isLoading={isLoading} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-[600px]">
                    <LedgerTable entries={ledger} isLoading={isLoading} />
                </div>
            )}
        </div>
    );
};

export default Accounting;
