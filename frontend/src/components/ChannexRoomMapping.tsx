import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Card, Button } from './UIComponents';
import { Save, Loader, Wand2 } from 'lucide-react';

interface RoomMapping {
    localRoomType: string;
    channexRoomTypeId?: string;
    channexRatePlanId?: string;
}

interface ChannexRoomMappingProps {
    propertyId: string;
    onMappingsSaved: () => void;
}

const ChannexRoomMapping: React.FC<ChannexRoomMappingProps> = ({
    propertyId,
    onMappingsSaved
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [remoteRooms, setRemoteRooms] = useState<any[]>([]); // New state for remote rooms
    const [mappings, setMappings] = useState<RoomMapping[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isAutoSyncing, setIsAutoSyncing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [propertyId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // API_BASE_URL imported from config

            // 1. Fetch local room types
            const localRes = await fetch(`${API_BASE_URL}/api/channex/rooms/local?property_id=${propertyId}`);
            const localData = await localRes.json();

            // 2. Fetch existing mappings
            const mapRes = await fetch(`${API_BASE_URL}/api/channex/mappings?property_id=${propertyId}`);
            const mapData = await mapRes.json();

            // 3. Fetch remote room types (for dropdown)
            const remoteRes = await fetch(`${API_BASE_URL}/api/channex/rooms/remote?property_id=${propertyId}`);
            const remoteData = await remoteRes.json();


            setRemoteRooms(remoteData.rooms || []);

            // Initialize mappings array
            const existingMappings = mapData.mappings || [];
            const mappingsMap = new Map(
                existingMappings.map((m: any) => [
                    m.localRoomType,
                    {
                        localRoomType: m.localRoomType,
                        channexRoomTypeId: m.channexRoomTypeId,
                        channexRatePlanId: m.channexRatePlanId
                    }
                ])
            );

            const allMappings = (localData.roomTypes || []).map((type: string) =>
                mappingsMap.get(type) || { localRoomType: type }
            );

            setMappings(allMappings);

        } catch (err: any) {
            console.error('Fetch error:', err);
            // Don't block everything if remote rooms fail (e.g. not connected yet)
            if (err.message.includes('Channex not connected')) {
                // Just ignore remote rooms
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMappingChange = (index: number, field: keyof RoomMapping, value: string) => {
        const updated = [...mappings];
        updated[index] = { ...updated[index], [field]: value };
        setMappings(updated);
    };

    // Auto-fill Rate Plan ID if standard format is detected? 
    // For now, keep it manual.

    const handleAutoSync = async () => {
        setIsAutoSyncing(true);
        setError(null);
        try {
            // API_BASE_URL imported from config
            const response = await fetch(`${API_BASE_URL}/api/channex/mappings/auto-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property_id: propertyId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to auto-sync mappings');
            }

            alert(data.message);
            fetchData(); // Refresh mappings after sync

        } catch (err: any) {
            console.error('Auto Sync error:', err);
            setError(err.message);
        } finally {
            setIsAutoSyncing(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setError(null);

        try {
            // API_BASE_URL imported from config
            const response = await fetch(`${API_BASE_URL}/api/channex/save-mappings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    mappings: mappings.filter(m => m.channexRoomTypeId) // Only save ones with IDs
                })
            });

            if (!response.ok) throw new Error('Failed to save mappings');

            alert('Mappings saved successfully!');
            onMappingsSaved();

        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Loading mappings...</div>;

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                    Room Type Mappings
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        icon={isAutoSyncing ? Loader : Wand2}
                        onClick={handleAutoSync}
                        disabled={isAutoSyncing || saving}
                    >
                        {isAutoSyncing ? 'Matching...' : 'Auto Match'}
                    </Button>
                    <Button onClick={handleSaveAll} disabled={saving || isAutoSyncing} icon={Save}>
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {mappings.map((mapping, index) => (
                    <div key={mapping.localRoomType} className="p-4 border border-slate-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Local Room Type
                                </label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-200 font-medium">
                                    {mapping.localRoomType}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Channex Room Type
                                </label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    value={mapping.channexRoomTypeId || ''}
                                    onChange={(e) => handleMappingChange(index, 'channexRoomTypeId', e.target.value)}
                                >
                                    <option value="">-- Unmapped --</option>
                                    {remoteRooms.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.attributes.title} ({r.id})
                                        </option>
                                    ))}
                                    {/* Fallback if remote rooms failed to load */}
                                    {!remoteRooms.length && mapping.channexRoomTypeId && (
                                        <option value={mapping.channexRoomTypeId}>{mapping.channexRoomTypeId}</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Rate Plan ID
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    placeholder="Rate Plan ID"
                                    value={mapping.channexRatePlanId || ''}
                                    onChange={(e) => handleMappingChange(index, 'channexRatePlanId', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ChannexRoomMapping;
