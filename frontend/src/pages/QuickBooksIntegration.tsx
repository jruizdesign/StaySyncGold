import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UIComponents';
import { Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { supabase } from '../lib/supabase';
import { SaaSUpgradeLock } from '../components/SaaSUpgradeLock';

interface QBAccount {
    id: string;
    name: string;
    type: string;
}

interface QBSettings {
    is_connected: boolean;
    room_revenue_account_id?: string;
    tax_account_id?: string;
    bank_account_id?: string;
}

export const QuickBooksIntegration: React.FC = () => {
    const { user, session } = useAuth();
    const [settings, setSettings] = useState<QBSettings | null>(null);
    const [accounts, setAccounts] = useState<QBAccount[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    const [mappings, setMappings] = useState({
        room_revenue_account_id: '',
        tax_account_id: '',
        bank_account_id: ''
    });

    const getHeaders = () => ({
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
    });

    const fetchData = async () => {
        if (!user?.propertyId || !session?.access_token) return;
        try {
            const { data: propData } = await supabase.from('properties').select('enable_quickbooks').eq('id', user.propertyId).single();
            if (!propData?.enable_quickbooks) {
                setHasAccess(false);
                setLoading(false);
                return;
            }
            setHasAccess(true);

            const [statusRes, logsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/quickbooks/status?property_id=${user.propertyId}`, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/api/quickbooks/logs?property_id=${user.propertyId}`, { headers: getHeaders() })
            ]);

            const statusData = await statusRes.json();
            setSettings(statusData);
            setMappings({
                room_revenue_account_id: statusData.room_revenue_account_id || '',
                tax_account_id: statusData.tax_account_id || '',
                bank_account_id: statusData.bank_account_id || ''
            });

            const logsData = await logsRes.json();
            setLogs(logsData);

            if (statusData.is_connected) {
                const accountsRes = await fetch(`${API_BASE_URL}/api/quickbooks/accounts`, { headers: getHeaders() });
                const accountsData = await accountsRes.json();
                setAccounts(accountsData);
            }
        } catch (error) {
            console.error('Error fetching QB data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.propertyId, session?.access_token]);

    const handleConnect = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/quickbooks/authUri`, {
                headers: getHeaders(),
            });
            const data = await res.json();
            if (data.authUri) {
                // Redirect user to Intuit OAuth login page
                window.location.href = data.authUri;
            }
        } catch (error) {
            console.error('Connect error:', error);
            setLoading(false);
        }
    };

    const saveMappings = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/quickbooks/mapping`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ property_id: user?.propertyId, ...mappings })
            });
            alert('Mappings saved successfully!');
        } catch (error) {
            console.error('Mapping error:', error);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await fetch(`${API_BASE_URL}/api/quickbooks/sync`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ property_id: user?.propertyId })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Successfully synced ${data.synced_count} payment(s)!`);
                fetchData();
            }
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return <div className="p-8">Loading QuickBooks Integration...</div>;

    if (hasAccess === false) {
        return (
            <div className="p-8 pb-32">
                <SaaSUpgradeLock 
                    moduleName="QuickBooks Sync" 
                    description="Automatically synchronize your daily ledger and payments to QuickBooks Online." 
                    icon="quickbooks" 
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">QuickBooks Integration</h1>
                {settings?.is_connected ? (
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <Badge color="green">Connected to QuickBooks</Badge>
                    </div>
                ) : (
                    <Badge color="gray">Not Connected</Badge>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connection & Mapping */}
                <Card className="space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <Server className="w-6 h-6 text-blue-600" />
                        <h2 className="text-lg font-bold">Connection Settings</h2>
                    </div>

                    {!settings?.is_connected ? (
                        <div className="py-8 text-center space-y-4">
                            <p className="text-slate-600">Connect to QuickBooks Online to sync your daily financial transactions directly to your accounting software.</p>
                            <Button onClick={handleConnect}>Connect to QuickBooks</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Map your Cardea payment types to your QuickBooks Chart of Accounts.</p>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Room Revenue Account</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={mappings.room_revenue_account_id}
                                    onChange={(e) => setMappings({ ...mappings, room_revenue_account_id: e.target.value })}
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Tax Liability Account</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={mappings.tax_account_id}
                                    onChange={(e) => setMappings({ ...mappings, tax_account_id: e.target.value })}
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Bank Depository Account</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={mappings.bank_account_id}
                                    onChange={(e) => setMappings({ ...mappings, bank_account_id: e.target.value })}
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 border-t">
                                <Button onClick={saveMappings}>Save Mappings</Button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Sync Controls & Logs */}
                <Card className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="w-6 h-6 text-emerald-600" />
                            <h2 className="text-lg font-bold">Sync Ledger</h2>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleSync}
                            disabled={!settings?.is_connected || syncing}
                        >
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-700">Recent Sync Logs</h3>
                        {logs.length === 0 ? (
                            <p className="text-sm text-slate-500 py-4 text-center">No sync logs available.</p>
                        ) : (
                            <div className="divide-y max-h-[400px] overflow-y-auto">
                                {logs.map((log) => (
                                    <div key={log.id} className="py-3 flex justify-between items-center text-sm">
                                        <div>
                                            <p className="font-medium text-slate-800">Payment {log.payment_id.split('-')[0]}</p>
                                            <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            {log.status === 'success' ? (
                                                <Badge color="green">Synced</Badge>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600 text-xs font-medium">
                                                    <AlertCircle className="w-4 h-4" /> Failed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
