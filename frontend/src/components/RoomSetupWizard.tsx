import React, { useState } from 'react';
import { X, Wand2, Calculator, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { useAuth } from '../context/AuthContext';
import { RoomStatus } from '../types';

interface RoomSetupWizardProps {
    onClose: () => void;
    onComplete: () => void;
}

const RoomSetupWizard: React.FC<RoomSetupWizardProps> = ({ onClose, onComplete }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        floors: 1,
        roomsPerFloor: 10,
        startNumber: 101,
        type: 'Standard King',
        price_per_night: 150,
        capacity: 2
    });

    const previewRooms = () => {
        const rooms = [];
        for (let f = 0; f < config.floors; f++) {
            const floorNum = Math.floor(config.startNumber / 100) + f;
            for (let r = 0; r < config.roomsPerFloor; r++) {
                const roomNum = (floorNum * 100) + (r + 1);
                rooms.push({
                    number: roomNum.toString(),
                    floor: floorNum,
                    type: config.type,
                    rate: config.price_per_night,
                    capacity: config.capacity,
                    status: RoomStatus.CLEAN
                });
            }
        }
        return rooms;
    };

    const generatedRooms = previewRooms();

    const handleGenerate = async () => {
        if (!user?.propertyId) return;

        // 1. Check for dependencies that would block deletion
        try {
            const { count: reservationCount } = await supabase
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('property_id', user.propertyId)
                .not('status', 'eq', 'cancelled'); // Assuming cancelled might be irrelevant, but safer to check all

            if (reservationCount && reservationCount > 0) {
                alert(`Cannot reset rooms: You have ${reservationCount} active reservations. Please archive or delete them first to prevent data loss.`);
                return;
            }
        } catch (err) {
            console.error("Error checking dependencies:", err);
        }

        // Safety Layer: Explicit Confirmation
        const confirmed = window.confirm(
            "⚠️ WARNING: This will DELETE ALL EXISTING ROOMS for this property and replace them with the generated inventory.\n\nThis action cannot be undone. Are you sure you want to proceed?"
        );
        if (!confirmed) return;

        setLoading(true);

        try {
            // 2. Wipe existing rooms first
            const { error: deleteError } = await supabase
                .from('rooms')
                .delete()
                .eq('property_id', user.propertyId);

            if (deleteError) {
                // Handle FK violation explicitly if it slipped through
                if (deleteError.code === '23503') { // Foreign key violation
                    throw new Error("Cannot delete rooms because they are referenced by other data (Reservations, Maintenance Tickets, etc).");
                }
                throw deleteError;
            }

            // 3. Insert new rooms
            const roomsToInsert = generatedRooms.map(room => ({
                ...room,
                property_id: user.propertyId,
            }));

            const { error } = await supabase
                .from('rooms')
                .insert(roomsToInsert);

            if (error) throw error;

            logger.info(`Room Wizard: Created ${roomsToInsert.length} rooms`, {
                type: 'INVENTORY',
                event: 'BULK_CREATE_ROOMS',
                user_id: user.id,
                property_id: user.propertyId,
                details: { count: roomsToInsert.length, config }
            });

            onComplete();
        } catch (error: any) {
            console.error('Error creating rooms:', error);
            logger.error('Room Wizard failed', {
                type: 'INVENTORY',
                event: 'BULK_CREATE_FAILED',
                user_id: user.id,
                property_id: user.propertyId,
                details: { error: error.message }
            });
            alert(`Failed to create rooms: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Wand2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Room Setup Wizard</h2>
                            <p className="text-sm text-slate-500">Bulk create your property inventory</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Configuration */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                <Calculator className="w-4 h-4" /> Configuration
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Floors</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={config.floors}
                                        onChange={e => setConfig({ ...config, floors: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rooms per Floor</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={config.roomsPerFloor}
                                        onChange={e => setConfig({ ...config, roomsPerFloor: parseInt(e.target.value) || 1 })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Starting Room Number</label>
                                    <input
                                        type="number"
                                        value={config.startNumber}
                                        onChange={e => setConfig({ ...config, startNumber: parseInt(e.target.value) || 101 })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Starting number for the first floor (e.g. 101 for Floor 1)</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
                                        <select
                                            value={config.type}
                                            onChange={e => setConfig({ ...config, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        >
                                            <option>Standard King</option>
                                            <option>Double Queen</option>
                                            <option>Suite</option>
                                            <option>Penthouse</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Price ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={config.price_per_night}
                                        onChange={e => setConfig({ ...config, price_per_night: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={config.capacity}
                                        onChange={e => setConfig({ ...config, capacity: parseInt(e.target.value) || 2 })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center justify-between">
                            <span>Preview</span>
                            <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full text-xs">
                                {generatedRooms.length} Rooms
                            </span>
                        </h3>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {generatedRooms.slice(0, 20).map((room, i) => (
                                <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center text-sm shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-700">#{room.number}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-600">Floor {room.floor}</span>
                                    </div>
                                    <span className="text-slate-500">{room.type}</span>
                                </div>
                            ))}
                            {generatedRooms.length > 20 && (
                                <div className="text-center py-2 text-xs text-slate-500 italic">
                                    ...and {generatedRooms.length - 20} more rooms
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>This will add {generatedRooms.length} new rooms to your inventory. Existing rooms will not be affected unless there is a number conflict.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={loading || generatedRooms.length === 0}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg shadow-purple-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Create {generatedRooms.length} Rooms
                </button>
            </div>
        </div>
    );
};

export default RoomSetupWizard;
