import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from './UIComponents';
import { Save, Plus, Loader } from 'lucide-react';

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
    const [localRoomTypes, setLocalRoomTypes] = useState<string[]>([]);
    const [mappings, setMappings] = useState<RoomMapping[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [propertyId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch local room types
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const typesResponse = await fetch(`${API_BASE_URL}/api/channex/mcp/room-types/local?property_id=${propertyId}`);
            const typesData = await typesResponse.json();

            if (!typesResponse.ok) {
                throw new Error(typesData.error || 'Failed to fetch room types');
            }

            // Fetch existing mappings
            const mappingsResponse = await fetch(`${API_BASE_URL}/api/channex/mcp/mappings?property_id=${propertyId}`);
            const mappingsData = await mappingsResponse.json();

            if (!mappingsResponse.ok) {
                throw new Error(mappingsData.error || 'Failed to fetch mappings');
            }

            setLocalRoomTypes(typesData.roomTypes || []);

            // Initialize mappings array
            const existingMappings = mappingsData.mappings || [];
            const mappingsMap = new Map(
                existingMappings.map((m: any) => [
                    m.local_room_type,
                    {
                        localRoomType: m.local_room_type,
                        channexRoomTypeId: m.channex_room_type_id,
                        channexRatePlanId: m.channex_rate_plan_id
                    }
                ])
            );

            const allMappings = typesData.roomTypes.map((type: string) =>
                mappingsMap.get(type) || { localRoomType: type }
            );

            setMappings(allMappings);

        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMappingChange = (index: number, field: 'channexRoomTypeId' | 'channexRatePlanId', value: string) => {
        const updated = [...mappings];
        updated[index] = { ...updated[index], [field]: value };
        setMappings(updated);
    };

    const handleSaveMapping = async (mapping: RoomMapping) => {
        if (!mapping.channexRoomTypeId) {
            alert('Please enter a Channex Room Type ID');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const response = await fetch(`${API_BASE_URL}/api/channex/mcp/mappings/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: propertyId,
                    local_room_type: mapping.localRoomType,
                    channex_room_type_id: mapping.channexRoomTypeId,
                    channex_rate_plan_id: mapping.channexRatePlanId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save mapping');
            }

            alert('Mapping saved successfully!');
            onMappingsSaved();

        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex justify-center items-center h-32">
                    <Loader className="animate-spin text-gold-500" />
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Room Type Mappings
            </h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {mappings.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <p>No room types found</p>
                    <p className="text-sm mt-1">Please create rooms first</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {mappings.map((mapping, index) => (
                        <div key={mapping.localRoomType} className="p-4 border border-slate-200 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Local Room Type
                                    </label>
                                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                                        <span className="font-medium text-slate-900">{mapping.localRoomType}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Channex Room Type ID *
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                                        placeholder="e.g., rt_abc123"
                                        value={mapping.channexRoomTypeId || ''}
                                        onChange={(e) => handleMappingChange(index, 'channexRoomTypeId', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Channex Rate Plan ID
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                                        placeholder="e.g., rp_xyz789"
                                        value={mapping.channexRatePlanId || ''}
                                        onChange={(e) => handleMappingChange(index, 'channexRatePlanId', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Button
                                        icon={Save}
                                        onClick={() => handleSaveMapping(mapping)}
                                        disabled={saving}
                                        size="sm"
                                        className="w-full"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>

                            {mapping.channexRoomTypeId && (
                                <div className="mt-2">
                                    <Badge color="green">Mapped</Badge>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <strong>How to get Channex IDs:</strong>
                </p>
                <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Ask the AI agent to fetch Channex room types using MCP tools</li>
                    <li>Copy the room type IDs and rate plan IDs from the response</li>
                    <li>Paste them into the fields above and save</li>
                </ol>
            </div>
        </Card>
    );
};

export default ChannexRoomMapping;
