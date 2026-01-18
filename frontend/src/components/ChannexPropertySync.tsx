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
    lastSync,
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
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
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
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
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
                    <div className="flex items-center gap-2 text-green-600 mb-4">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                            <p className="font-medium">Connected to Channex</p>
                            <p className="text-xs text-slate-500">ID: {channexPropertyId}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Channex API Key
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 p-2 border border-slate-300 rounded-lg"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Channex API Key"
                                />
                                <Button
                                    onClick={handleFetchProperties}
                                    disabled={!apiKey || isFetching}
                                >
                                    {isFetching ? <Loader className="animate-spin w-4 h-4" /> : 'Fetch Properties'}
                                </Button>
                            </div>
                        </div>

                        {properties.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Select Property
                                </label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    value={selectedProperty}
                                    onChange={(e) => setSelectedProperty(e.target.value)}
                                >
                                    <option value="">-- Select Property --</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.attributes.title} ({p.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {properties.length > 0 && (
                            <Button
                                onClick={handleConnect}
                                disabled={!selectedProperty || isSaving}
                                className="w-full"
                            >
                                {isSaving ? 'Connecting...' : 'Connect Property'}
                            </Button>
                        )}
                    </>
                )}

                {error && (
                    <div className="p-3 bg-red-50 text-red-800 rounded text-sm">
                        {error}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ChannexPropertySync;
