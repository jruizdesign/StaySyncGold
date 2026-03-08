import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button, Card } from './UIComponents';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

interface RateAdjustmentCalendarProps {
    propertyId: string;
    dynamicEnabled?: boolean;
    userRole?: string;
}

const RateAdjustmentCalendar: React.FC<RateAdjustmentCalendarProps> = ({ propertyId, userRole = 'admin' }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [roomTypes, setRoomTypes] = useState<string[]>([]);
    const [rates, setRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const { session } = useAuth();

    // Rate Plan State
    const [ratePlans, setRatePlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

    // Bulk Edit State
    const [bulkPrice, setBulkPrice] = useState('');
    const [selectedType, setSelectedType] = useState('ALL');
    const [bulkOperation, setBulkOperation] = useState('SET');
    const [bulkDays, setBulkDays] = useState('ALL');

    useEffect(() => {
        if (propertyId) {
            fetchRoomTypes();
            fetchPlans();
        }
    }, [propertyId]);

    useEffect(() => {
        if (propertyId && selectedPlanId) {
            fetchRates();
        }
    }, [propertyId, selectedMonth, selectedPlanId]);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('rate_plans')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: true });

        if (data && data.length > 0) {
            setRatePlans(data);
            if (!selectedPlanId) setSelectedPlanId(data[0].id); // Default to first (usually Standard)
        }
    };

    const fetchRoomTypes = async () => {
        const { data } = await supabase
            .from('rooms')
            .select('type')
            .eq('property_id', propertyId);

        if (data) {
            const types = Array.from(new Set(data.map((r: any) => r.type)));
            setRoomTypes(types);
        }
    };

    const fetchRates = async () => {
        // if (!selectedPlanId) return; // Allow fetching without plan ID if mostly just seeing base overrides? No, fetchService handles it.
        setLoading(true);
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

        try {
            // Use New Dynamic API
            const params = new URLSearchParams({
                startDate: startOfMonth.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
                ratePlanId: selectedPlanId || ''
            });

            const res = await fetch(`${API_BASE_URL}/api/rates/dynamic?${params}`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                // Map API response to Component state format if needed
                // API returns { report_date, room_name, final_rate, is_override }
                // Component expects { room_type (name), date, price }
                // We need to map `report_date` -> `date`, `final_rate` -> `price`, `room_name` -> `room_type`
                // And we can store `is_override` for styling.
                const mapped = data.map((r: any) => ({
                    date: r.report_date.split('T')[0], // ensure YYYY-MM-DD
                    room_type: r.room_name,
                    price: parseFloat(r.final_rate),
                    is_override: r.is_override,
                    room_type_id: r.room_type_id // We need this for updates!
                }));
                setRates(mapped);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = async (roomType: string, date: Date, price: string) => {
        // RBAC Check
        const allowedRoles = ['admin', 'manager', 'owner']; // 'owner'
        if (!allowedRoles.includes((userRole || '').toLowerCase())) {
            alert("Permission Denied: Only Managers can edit rates.");
            return;
        }

        const dateStr = date.toISOString().split('T')[0];
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) return;

        // Find room_type_id from rates (we mapped it earlier) or we need to look it up.
        // Since we mapped rates from the API, we might find it in `rates` array if that date exists.
        // If it's a new date that wasn't previously loaded... wait, the Spine query returns ALL dates. 
        // So we ALWAYS have a record for every cell.
        const targetRate = rates.find(r => r.room_type === roomType && r.date === dateStr);
        const roomTypeId = targetRate?.room_type_id;

        if (!roomTypeId) {
            console.error("Could not find Room Type ID for update");
            return;
        }

        // Optimistic UI Update
        const newRates = [...rates];
        const existingIndex = newRates.findIndex(r => r.room_type === roomType && r.date === dateStr);

        if (existingIndex >= 0) {
            newRates[existingIndex].price = numericPrice;
            newRates[existingIndex].is_override = true; // Mark optimistic as override
        }
        setRates(newRates);

        // Async Save via API
        try {
            await fetch(`${API_BASE_URL}/api/rates/dynamic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    propertyId, // backend ensures from token, but ok
                    roomTypeId: roomTypeId,
                    date: dateStr,
                    price: numericPrice,
                    ratePlanId: selectedPlanId
                })
            });
        } catch (e) {
            console.error("Failed to save rate", e);
            fetchRates(); // Revert on error
        }
    };

    const applyBulkUpdate = async () => {
        if (!bulkPrice || !selectedPlanId) return;
        const numericValue = parseFloat(bulkPrice);
        if (isNaN(numericValue)) return;

        const planName = ratePlans.find(p => p.id === selectedPlanId)?.name || 'Unknown Plan';
        const opLabel = bulkOperation === 'SET' ? 'Set to' : bulkOperation.includes('INC') ? 'Increase by' : 'Decrease by';
        const unitLabel = bulkOperation.includes('PCT') ? '%' : '$';

        if (!window.confirm(`${opLabel} ${numericValue}${unitLabel} for ${selectedType === 'ALL' ? 'ALL rooms' : selectedType} (${bulkDays}) in "${planName}"?`)) return;

        setSaving(true);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        const daysInMonth = endOfMonth.getDate();

        const updates: any[] = [];
        const targets = selectedType === 'ALL' ? roomTypes : [selectedType];

        for (const type of targets) {
            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), d);
                const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
                // Common Hotel Logic: Fri & Sat check-ins are weekend. 
                // Let's stick to Fri/Sat as weekend for now.

                if (bulkDays === 'WEEKDAY' && (dayOfWeek === 5 || dayOfWeek === 6)) continue;
                if (bulkDays === 'WEEKEND' && (dayOfWeek !== 5 && dayOfWeek !== 6)) continue;

                const dateStr = date.toISOString().split('T')[0];

                // Determine Base Price
                // If operation is NOT 'SET', we need the current price. 
                // Current price is either an existing override OR the base price.
                // However, we only have `rates` in state which contains `price` (merged).
                const currentRate = rates.find(r => r.room_type === type && r.date === dateStr);
                const basePrice = currentRate ? currentRate.price : 0; // Fallback 0 risk if data missing, but spine query ensures data.

                let newPrice = numericValue;

                if (bulkOperation !== 'SET') {
                    if (bulkOperation === 'INC_AMT') newPrice = basePrice + numericValue;
                    if (bulkOperation === 'DEC_AMT') newPrice = basePrice - numericValue;
                    if (bulkOperation === 'INC_PCT') newPrice = basePrice + (basePrice * (numericValue / 100));
                    if (bulkOperation === 'DEC_PCT') newPrice = basePrice - (basePrice * (numericValue / 100));
                }

                // formatting
                newPrice = Math.round(newPrice * 100) / 100;

                updates.push({
                    property_id: propertyId,
                    room_type: type,
                    date: dateStr,
                    price: newPrice,
                    rate_plan_id: selectedPlanId
                });
            }
        }

        // Batch upsert
        const { error } = await supabase.from('room_rates').upsert(updates, { onConflict: 'property_id, room_type, date, rate_plan_id' });

        if (error) {
            alert("Failed to bulk update: " + error.message);
        } else {
            fetchRates();
            setBulkPrice(''); // Clear value after success? Or keep for repeat? Clearing is safer.
        }
        setSaving(false);
    };

    const pushToChannex = async () => {
        alert("This will push rates for ALL plans to Channex (Logic pending multiple plan mapping support). For now pushing selected plan.");
        // Note: Real implementation needs to map local Rate Plan ID to Channex Rate Plan ID.
        // We'll skip that complexity for this specific MVP step and just alert.
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

        setSyncing(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/channex/ari`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    property_id: propertyId,
                    start_date: startOfMonth.toISOString().split('T')[0],
                    end_date: endOfMonth.toISOString().split('T')[0],
                    rate_plan_id: selectedPlanId // Ensure backend handles this
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`Successfully synced rates to Channex! (${data.count} updates)`);
            } else {
                alert(`Sync failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            alert('Sync Error: ' + e.message);
        } finally {
            setSyncing(false);
        }
    };

    // Expose refresh capability if needed, or just let useEffect handle it.
    // We add a listener for plan changes from parent? No need if simple prop.

    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="space-y-6">
            {/* Rate Plan Selector */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="font-bold text-slate-700">Active Rate Plan:</span>
                <select
                    className="p-2 border border-slate-300 rounded-lg min-w-[200px] font-medium text-slate-900 focus:ring-2 focus:ring-gold-500 outline-none"
                    value={selectedPlanId || ''}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                    {ratePlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                </select>
                <div className="text-xs text-slate-500 ml-2">
                    {ratePlans.find(p => p.id === selectedPlanId)?.description}
                </div>
            </div>

            {/* Controls Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="px-4 font-bold text-slate-700 min-w-[140px] text-center">
                            {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <Button variant="outline" icon={RefreshCw} onClick={fetchRates} disabled={loading}>Refresh</Button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-500 uppercase">Bulk:</span>

                            {/* Target Room Type */}
                            <select
                                className="bg-white border border-slate-300 text-xs rounded px-2 py-1.5 focus:ring-1 focus:ring-gold-500 outline-none"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="ALL">All Rooms</option>
                                {roomTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            {/* Operation Type */}
                            <select
                                className="bg-white border border-slate-300 text-xs rounded px-2 py-1.5 focus:ring-1 focus:ring-gold-500 outline-none"
                                value={bulkOperation}
                                onChange={(e) => setBulkOperation(e.target.value)}
                            >
                                <option value="SET">Set Fixed Price ($)</option>
                                <option value="INC_AMT">Increase By ($)</option>
                                <option value="DEC_AMT">Decrease By ($)</option>
                                <option value="INC_PCT">Increase By (%)</option>
                                <option value="DEC_PCT">Decrease By (%)</option>
                            </select>

                            {/* Value Input */}
                            <input
                                type="number"
                                placeholder="Value"
                                className="w-20 px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-gold-500 outline-none"
                                value={bulkPrice}
                                onChange={(e) => setBulkPrice(e.target.value)}
                            />

                            {/* Day Selector */}
                            <select
                                className="bg-white border border-slate-300 text-xs rounded px-2 py-1.5 focus:ring-1 focus:ring-gold-500 outline-none"
                                value={bulkDays}
                                onChange={(e) => setBulkDays(e.target.value)}
                            >
                                <option value="ALL">All Days</option>
                                <option value="WEEKDAY">Weekdays (Sun-Thu)</option>
                                <option value="WEEKEND">Weekends (Fri-Sat)</option>
                            </select>

                            <Button size="sm" onClick={applyBulkUpdate} disabled={saving || !bulkPrice}>
                                Apply
                            </Button>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        icon={syncing ? RefreshCw : Upload}
                        onClick={pushToChannex}
                        disabled={syncing}
                        className={syncing ? "animate-pulse" : ""}
                    >
                        {syncing ? 'Pushing...' : 'Push to Channels'}
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="overflow-x-auto !p-0">
                <div className="min-w-max">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 text-left bg-slate-50 sticky left-0 z-20 border-b border-r border-slate-200 min-w-[150px] font-bold text-slate-700 shadow-sm">
                                    Room Type
                                </th>
                                {daysArray.map(day => {
                                    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    const isToday = new Date().toDateString() === date.toDateString();

                                    return (
                                        <th key={day} className={`p-2 min-w-[70px] text-center border-b border-r border-slate-200 ${isToday ? 'bg-gold-50 text-gold-700' : isWeekend ? 'bg-slate-50 text-slate-600' : 'bg-white text-slate-500'}`}>
                                            <div className="text-xs font-medium">{date.toLocaleString('default', { weekday: 'short' })}</div>
                                            <div className={`text-lg font-bold ${isToday ? 'text-gold-600' : ''}`}>{day}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {roomTypes.map(type => (
                                <tr key={type} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="p-4 font-semibold text-slate-700 sticky left-0 z-10 bg-white border-r border-b border-slate-200 group-hover:bg-slate-50 transition-colors shadow-sm">
                                        {type}
                                    </td>
                                    {daysArray.map(day => {
                                        const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
                                        const dateStr = date.toISOString().split('T')[0];
                                        const rate = rates.find(r => r.room_type === type && r.date === dateStr);
                                        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                                        return (
                                            <td key={day} className={`p-1 border-r border-b border-slate-100 relative ${isPast ? 'bg-slate-50' : ''}`}>
                                                <div className="relative group/cell">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">$</span>
                                                    <input
                                                        type="number"
                                                        className={`w-full h-10 pl-5 pr-1 text-center bg-transparent rounded focus:bg-white focus:ring-2 focus:ring-gold-500 focus:outline-none transition-all font-medium 
                                                            ${!rate ? 'text-slate-400 italic' : rate.is_override ? 'bg-yellow-50 text-amber-700 font-bold border border-yellow-200' : 'text-slate-800'}
                                                            `}
                                                        placeholder="-"
                                                        defaultValue={rate?.price}
                                                        onBlur={(e) => handleRateChange(type, date, e.target.value)}
                                                        tabIndex={isPast ? -1 : 0}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {roomTypes.length === 0 && (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="p-8 text-center text-slate-500">
                                        No room types found. Please create rooms in the Room Manager first.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default RateAdjustmentCalendar;
