import React, { useState } from 'react';
import { Card, Button } from './UIComponents';
import { Upload, Loader, Calendar } from 'lucide-react';

interface ChannexARIManagerProps {
    propertyId: string;
}

const ChannexARIManager: React.FC<ChannexARIManagerProps> = ({ propertyId }) => {
    console.log('[ChannexARIManager] Component function called!');
    console.log('[ChannexARIManager] propertyId received:', propertyId);
    console.log('[ChannexARIManager] propertyId type:', typeof propertyId);
    console.log('[ChannexARIManager] propertyId truthy?:', !!propertyId);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isPushing, setIsPushing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastPush, setLastPush] = useState<string | null>(null);

    // Defensive check
    if (!propertyId) {
        console.error('[ChannexARIManager] Returning null - No propertyId provided!');
        return null;
    }

    console.log('[ChannexARIManager] Passed defensive check, will render!');

    const handlePushARI = async () => {
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert('Start date must be before end date');
            return;
        }

        setIsPushing(true);
        setError(null);

        try {
            // Prepare ARI data
            const response = await fetch('/api/channex/mcp/ari/prepare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    start_date: startDate,
                    end_date: endDate
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to prepare ARI data');
            }

            // Show data summary and instructions
            const mappingsCount = data.data.mappings?.length || 0;
            const ratesCount = data.data.rates?.length || 0;

            alert(
                `ARI data is ready for sync!\n\n` +
                `Summary:\n` +
                `- Date Range: ${startDate} to ${endDate}\n` +
                `- Room Mappings: ${mappingsCount}\n` +
                `- Rate Records: ${ratesCount}\n\n` +
                `Next step: Ask the AI agent to push this data to Channex using MCP tools.`
            );

            setLastPush(new Date().toISOString());

        } catch (err: any) {
            console.error('Push ARI error:', err);
            setError(err.message);
        } finally {
            setIsPushing(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        ARI Management
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                        Push Availability, Rates, and Inventory to Channex
                    </p>
                </div>
                <Calendar className="w-6 h-6 text-slate-400" />
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <Button
                    icon={isPushing ? Loader : Upload}
                    onClick={handlePushARI}
                    disabled={isPushing || !startDate || !endDate}
                    className="w-full"
                >
                    {isPushing ? 'Preparing...' : 'Push Rates & Availability'}
                </Button>

                {lastPush && (
                    <p className="text-sm text-slate-500 text-center">
                        Last prepared: {new Date(lastPush).toLocaleString()}
                    </p>
                )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>How it works:</strong>
                </p>
                <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Select the date range for rate updates</li>
                    <li>Click "Push Rates & Availability" to prepare the data</li>
                    <li>Ask the AI agent to complete the sync using Channex MCP tools</li>
                    <li>The agent will update rates across all connected OTA channels</li>
                </ol>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Make sure you have configured rates in the Reservations → Rates & Revenue section before pushing to Channex.
                </p>
            </div>
        </Card>
    );
};

export default ChannexARIManager;
