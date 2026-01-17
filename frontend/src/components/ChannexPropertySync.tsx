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
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        setError(null);

        try {
            // Call backend to prepare property data
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE_URL}/api/channex/mcp/property/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property_id: propertyId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to prepare property sync');
            }

            // Show instructions for MCP sync
            alert(
                `Property data is ready for sync!\n\n` +
                `Next steps:\n` +
                `1. The AI agent will use Channex MCP tools to sync this property\n` +
                `2. Property Name: ${data.property.name}\n` +
                `3. Address: ${data.property.address}\n\n` +
                `Please ask the AI agent to complete the Channex property sync.`
            );

            // Note: The actual MCP sync will be done by the AI agent
            // After successful sync, the agent will call /api/channex/mcp/property/save-id

            onSyncComplete();

        } catch (err: any) {
            console.error('Sync error:', err);
            setError(err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Property Sync Status
                    </h3>

                    <div className="space-y-3">
                        {channexPropertyId ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <div>
                                    <p className="font-medium">Synced to Channex</p>
                                    <p className="text-xs text-slate-500">
                                        Property ID: {channexPropertyId}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-yellow-600">
                                <AlertCircle className="w-5 h-5" />
                                <p className="font-medium">Not synced</p>
                            </div>
                        )}

                        {lastSync && (
                            <p className="text-sm text-slate-500">
                                Last synced: {new Date(lastSync).toLocaleString()}
                            </p>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    icon={isSyncing ? Loader : RefreshCw}
                    onClick={handleSync}
                    disabled={isSyncing}
                    size="sm"
                >
                    {isSyncing ? 'Syncing...' : channexPropertyId ? 'Re-sync' : 'Sync to Channex'}
                </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Syncing requires the Channex MCP server to be configured.
                    The AI agent will handle the actual sync using MCP tools.
                </p>
            </div>
        </Card>
    );
};

export default ChannexPropertySync;
