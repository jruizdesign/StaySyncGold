import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { Card, Button } from './UIComponents';
import { CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';

interface ChannexPropertySyncProps {
    propertyId: string;
    channexPropertyId?: string;
    lastSync?: string;
    onSyncComplete: () => void;
}

const ChannexPropertySync: React.FC<ChannexPropertySyncProps> = ({
    propertyId,
    channexPropertyId,
    onSyncComplete
}) => {
    const [apiKey, setApiKey] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [properties, setProperties] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchProperties = async () => {
        if (!apiKey) return;
        setIsFetching(true);
        setError(null);
        try {
            // API_BASE_URL imported from config
            const response = await fetch(`${API_BASE_URL}/api/channex/properties?api_key=${apiKey}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to fetch properties');

            setProperties(data.properties || []);
            if (data.properties.length === 1) {
                setSelectedProperty(data.properties[0].id);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleConnect = async () => {
        if (!selectedProperty || !apiKey) return;
        setIsSaving(true);
        try {
            // API_BASE_URL imported from config
            const response = await fetch(`${API_BASE_URL}/api/channex/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    api_key: apiKey,
                    channex_property_id: selectedProperty
                })
            });

            if (!response.ok) throw new Error('Failed to connect property');

            onSyncComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Channel Connection
            </h3>

            <div className="space-y-4">
                {channexPropertyId ? (
                    <div className="flex items-center gap-2 text-green-600 mb-4 bg-green-50 p-4 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                            <p className="font-medium">Connected to Channex</p>
                            <p className="text-xs text-slate-500">ID: {channexPropertyId}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                <button onClick={() => window.location.reload()} className="underline hover:text-green-800 flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Refresh Status
                                </button>
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg mb-4">
                            Enter your Channex.io API Token and Property ID to enable synchronization.
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Channex API Token
                            </label>
                            <input
                                type="password"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="••••••••••••••••••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Channex Property ID
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                                    value={selectedProperty}
                                    onChange={(e) => setSelectedProperty(e.target.value)}
                                    placeholder="e.g. property_xyz"
                                />
                                <Button
                                    variant="outline"
                                    onClick={handleFetchProperties}
                                    disabled={!apiKey || isFetching}
                                    title="Auto-fetch properties if you don't know the ID"
                                >
                                    {isFetching ? <Loader className="animate-spin w-4 h-4" /> : 'Fetch IDs'}
                                </Button>
                            </div>
                            {properties.length > 0 && (
                                <select
                                    className="w-full mt-2 p-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                                    onChange={(e) => setSelectedProperty(e.target.value)}
                                    value={selectedProperty}
                                >
                                    <option value="">-- Or select from found properties --</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.attributes.title} ({p.id})</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="ghost" onClick={() => { setApiKey(''); setSelectedProperty(''); setError(null); }}>
                                Cancel
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={handleFetchProperties} // Re-using fetch as "Test" effectively
                                disabled={!apiKey || isFetching}
                            >
                                Test Connection
                            </Button>

                            <Button
                                onClick={handleConnect}
                                disabled={!selectedProperty || !apiKey || isSaving}
                            >
                                {isSaving ? 'Connecting...' : 'Save & Connect'}
                            </Button>
                        </div>
                    </>
                )}

                {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 text-red-800 rounded border border-red-200 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ChannexPropertySync;
