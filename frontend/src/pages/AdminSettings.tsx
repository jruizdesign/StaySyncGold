import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Card, Input, Select, Badge } from '../components/UIComponents';
import { Database, Users, Building, ShieldCheck, Plus, Layout, Globe, Loader, GitBranch, Trash2, Edit } from 'lucide-react';
import { Property, ChannelSetting } from '../types';
import { useAuth } from '../context/AuthContext';
import { CommitTracker } from '../components/CommitTracker';
import { createStaff, updateStaff, deleteStaff } from '../services/staff';


// --- Sub-Components ---

const DatabaseInspector: React.FC = () => {
    const { user } = useAuth();
    const [selectedTable, setSelectedTable] = useState('reservations');
    const [data, setData] = useState<any[]>([]);

    // Admin Filtering State
    const [properties, setProperties] = useState<Property[]>([]);
    const [filterPropertyId, setFilterPropertyId] = useState<string>('ALL');

    useEffect(() => {
        if (user?.isAdmin) {
            fetchProperties();
        }
    }, [user]);

    useEffect(() => {
        fetchTableData();
    }, [selectedTable, user, filterPropertyId]); // Re-fetch when filter changes

    const fetchProperties = async () => {
        const { data } = await supabase.from('properties').select('*');
        if (data) {
            const mapped: Property[] = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                location: p.location,
                createdAt: p.created_at,
                demo_mode: p.demo_mode
            }));
            setProperties(mapped);
        }
    };

    const fetchTableData = async () => {
        if (!user) return;

        let query = supabase.from(selectedTable).select('*').limit(50);

        // Scoping Logic
        if (user.isAdmin) {
            // Admin: Filter if specific property selected, otherwise show all
            if (filterPropertyId !== 'ALL' && ['reservations', 'rooms', 'guests', 'staff'].includes(selectedTable)) {
                query = query.eq('property_id', filterPropertyId);
            }
        } else if (user.propertyId && ['reservations', 'rooms', 'guests', 'staff'].includes(selectedTable)) {
            // Non-Admin: Forced scoping
            query = query.eq('property_id', user.propertyId);
        }

        const { data: tableData, error } = await query;

        if (error) {
            console.error('Error fetching data:', error);
            setData([]);
        } else {
            setData(tableData || []);
        }
    };

    const handleTestDb = async () => {
        try {
            // API_BASE_URL injected via config
            const res = await fetch(`${API_BASE_URL}/test-db`);
            const text = await res.text();
            if (!text) throw new Error('Empty response from server');
            const data = JSON.parse(text);
            if (res.ok) {
                alert(`Database Connected! Server Time: ${data.time}`);
            } else {
                alert(`Database Error: ${data.error}`);
            }
        } catch (e: any) {
            alert('Failed to connect to backend: ' + e.message);
        }
    };

    return (
        <Card title="Database Inspector (Scoped)" action={
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestDb}>Test DB</Button>
                <Button variant="outline" onClick={fetchTableData}>Refresh</Button>
            </div>
        }>
            <div className="mb-6 space-y-4">
                {/* Admin Filter Controls */}
                {user?.isAdmin && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="text-sm font-bold text-slate-700">Admin View:</span>
                        <select
                            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2"
                            value={filterPropertyId}
                            onChange={(e) => setFilterPropertyId(e.target.value)}
                        >
                            <option value="ALL">All Properties (Global)</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Table</label>
                    <div className="flex gap-2 flex-wrap">
                        {['reservations', 'rooms', 'guests', 'staff', 'properties'].map(table => (
                            <button
                                key={table}
                                onClick={() => setSelectedTable(table)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTable === table
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {table}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            {data.length > 0 && Object.keys(data[0]).slice(0, 6).map(key => (
                                <th key={key} className="px-6 py-3 font-medium">{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row: any, idx: number) => (
                            <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                {Object.values(row).slice(0, 6).map((val: any, i) => (
                                    <td key={i} className="px-6 py-4 whitespace-nowrap text-slate-700">
                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No data found matching your filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const UserManagement: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [newStaff, setNewStaff] = useState({ firstname: '', last_name: '', email: '', role: 'Front Desk', pin: '' });
    const [isEditingStaff, setIsEditingStaff] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.propertyId) return;
        setSubmitting(true);
        try {
            if (isEditingStaff && editingStaffId) {
                // Update Logic
                await updateStaff(editingStaffId, {
                    property_id: user.propertyId,
                    firstname: newStaff.firstname,
                    last_name: newStaff.last_name,
                    email: newStaff.email,
                    role: newStaff.role,
                    pin: newStaff.pin, // Optional update handled by backend
                    phone_num: ''
                });
                alert('Staff member updated successfully');
            } else {
                // Create Logic
                await createStaff({
                    property_id: user.propertyId,
                    firstname: newStaff.firstname,
                    last_name: newStaff.last_name,
                    email: newStaff.email,
                    role: newStaff.role,
                    pin: newStaff.pin,
                    phone_num: ''
                });
                alert('Staff member added successfully');
            }

            setNewStaff({ firstname: '', last_name: '', email: '', role: 'Front Desk', pin: '' });
            setShowAddForm(false);
            setIsEditingStaff(false);
            setEditingStaffId(null);
            fetchUsers();

        } catch (err: any) {
            alert('Error saving staff: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (staff: any) => {
        setNewStaff({
            firstname: staff.firstname,
            last_name: staff.last_name,
            email: staff.email || '', // Email might be missing in some schemas/mock
            role: staff.role,
            pin: '' // Don't show existing PIN for security, simple logic: empty = no change
        });
        setEditingStaffId(staff.id);
        setIsEditingStaff(true);
        setShowAddForm(true);
    };

    const handleDeleteClick = async (staffId: string) => {
        if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;

        try {
            await deleteStaff(staffId);
            fetchUsers(); // Refresh list
        } catch (err: any) {
            alert('Failed to delete staff: ' + err.message);
        }
    };

    useEffect(() => {
        if (user?.propertyId) fetchUsers();
    }, [user]);

    const fetchUsers = async () => {
        setLoading(true);
        // Fetching from 'staff' table as primary source for property staff
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .eq('property_id', user?.propertyId);

        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    return (
        <Card title="Staff Management" action={
            <Button icon={Plus} onClick={() => {
                setShowAddForm(!showAddForm);
                if (!showAddForm) {
                    // Reset if opening
                    setNewStaff({ firstname: '', last_name: '', email: '', role: 'Front Desk', pin: '' });
                    setIsEditingStaff(false);
                    setEditingStaffId(null);
                }
            }}>
                {showAddForm ? 'Cancel' : 'Add Staff'}
            </Button>
        }>
            <div className="space-y-4">
                {showAddForm && (
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 mb-4 animate-fadeIn">
                        <h4 className="font-semibold text-slate-800 mb-3">{isEditingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</h4>
                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="First Name" value={newStaff.firstname} onChange={e => setNewStaff({ ...newStaff, firstname: e.target.value })} required />
                                <Input label="Last Name" value={newStaff.last_name} onChange={e => setNewStaff({ ...newStaff, last_name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Email" type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                        <select className="w-full p-2 border rounded-md" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                                            <option>Front Desk</option>
                                            <option>Housekeeper</option>
                                            <option>Manager</option>
                                            <option>Maintenance</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">PIN (4-digits) {isEditingStaff && <span className="text-xs text-slate-500 font-normal">(Leave blank to keep unchanged)</span>}</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-slate-300 rounded-md"
                                            value={newStaff.pin}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setNewStaff({ ...newStaff, pin: val });
                                            }}
                                            required={!isEditingStaff}
                                            placeholder="1234"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Save Staff'}</Button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-2">
                    {loading ? <Loader className="animate-spin" /> : users.map((staff: any) => (
                        <div key={staff.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                    {staff.firstname?.[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{staff.firstname} {staff.last_name}</p>
                                    <p className="text-sm text-slate-500">{staff.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-3">
                                    <Badge color="green">Active</Badge>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(staff)}
                                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            title="Edit Staff"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(staff.id)}
                                            className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Staff"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                    ))}
                            {!loading && users.length === 0 && <p className="text-slate-500 text-center py-4">No staff found.</p>}
                        </div>
            </div>
        </Card>
    );
};

const RoomWizard: React.FC = () => {
    const { user } = useAuth();
    const [roomNumber, setRoomNumber] = useState('');
    const [type, setType] = useState('King Suite');
    const [price_per_night, setPrice] = useState('200');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleCreateRoom = async () => {
        if (!user?.propertyId) return;
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.from('rooms').insert({
                id: crypto.randomUUID(),
                property_id: user.propertyId,
                number: roomNumber,
                type: type,
                price_per_night: parseFloat(price_per_night),
                status: 'Clean' // Default
            });

            if (error) throw error;
            setMessage('Room created successfully!');
            setRoomNumber('');
        } catch (e: any) {
            setMessage('Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Quick Room Add">
            <div className="max-w-2xl mx-auto space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Room Number"
                        placeholder="e.g. 101"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                    />
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Room Type</label>
                        <select
                            className="w-full p-2 border border-slate-300 rounded-md"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option>King Suite</option>
                            <option>Double Queen</option>
                            <option>Standard</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Rate ($)"
                        type="number"
                        value={price_per_night}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>

                {message && <p className={`text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}

                <div className="flex justify-end pt-4">
                    <Button onClick={handleCreateRoom} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Room'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

const ChannelManager: React.FC = () => {
    const { user } = useAuth();
    const [channexConfig, setChannexConfig] = useState<ChannelSetting | null>(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Form State
    const [apiToken, setApiToken] = useState('');
    const [propertyMappingId, setPropertyMappingId] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Channels (Fetched from Channex)
    const [activeChannels, setActiveChannels] = useState<any[]>([]);

    // Mapping State
    const [channexRooms, setChannexRooms] = useState<any[]>([]);
    const [localRoomTypes, setLocalRoomTypes] = useState<string[]>([]);
    const [mappings, setMappings] = useState<Record<string, string>>({}); // localType -> channexRoomId
    const [savingMappings, setSavingMappings] = useState(false);

    useEffect(() => {
        if (user?.propertyId) fetchConfiguration();
    }, [user?.propertyId]);

    const fetchConfiguration = async () => {
        setLoading(true);
        // 1. Get Local DB Config
        const { data, error } = await supabase
            .from('channel_settings')
            .select('*')
            .eq('property_id', user?.propertyId)
            .eq('channel_name', 'channex')
            .limit(1);

        if (error) {
            console.error("Error fetching channel config:", error);
            if (error.code === '42P01') {
                alert("Setup Required: The 'channel_settings' table is missing in Supabase. Please run the database migration.");
            }
        }

        if (data && data.length > 0) {
            const config = data[0];
            setChannexConfig(config);
            setApiToken(config.api_key || '');
            setPropertyMappingId(config.property_mapping_id || '');

            // 2. Fetch Active Channels status from Channex via Backend Proxy
            await fetchActiveChannels(user?.propertyId || '');

            // 3. Fetch Mapping Data
            await fetchMappingData(user?.propertyId || '');
        } else {
            setIsEditing(true);
        }
        setLoading(false);
    };

    const fetchActiveChannels = async (propertyId: string) => {
        try {
            // API_BASE_URL injected via config
            const res = await fetch(`${API_BASE_URL}/api/channex/status?property_id=${propertyId}`);
            const text = await res.text();
            if (!text) return; // Handle empty response gracefully
            const json = JSON.parse(text);
            if (json.channels) {
                setActiveChannels(json.channels);
            }
        } catch (e) {
            console.error("Failed to fetch Channex channels", e);
        }
    };

    const fetchMappingData = async (propertyId: string) => {
        try {
            // API_BASE_URL injected via config
            // A. Fetch Channex Rooms
            const channexRes = await fetch(`${API_BASE_URL}/api/channex/rooms?property_id=${propertyId}`);
            const channexText = await channexRes.text();
            const channexJson = channexText ? JSON.parse(channexText) : {};
            if (channexJson.rooms) {
                setChannexRooms(channexJson.rooms);
            }

            // B. Fetch Local Room Types (Distinct types from rooms table)
            // Note: In a real app, you might have a dedicated 'room_types' table. 
            // Here we assume we just distinct select from 'rooms' or use a hardcoded set if table is empty.
            const { data: localRooms } = await supabase
                .from('rooms')
                .select('type')
                .eq('property_id', propertyId);

            if (localRooms) {
                // Get unique types
                const uniqueTypes = Array.from(new Set(localRooms.map(r => r.type)));
                setLocalRoomTypes(uniqueTypes);
            }

            // C. Fetch Existing Mappings
            const mapRes = await fetch(`${API_BASE_URL}/api/channex/mappings?property_id=${propertyId}`);
            const mapText = await mapRes.text();
            const mapJson = mapText ? JSON.parse(mapText) : {};
            if (mapJson.mappings) {
                setMappings(mapJson.mappings);
            }

        } catch (e) {
            console.error("Failed to fetch mapping data", e);
        }
    };

    const handleTestConnection = async () => {
        if (!apiToken || !propertyMappingId) {
            alert('Please enter API Token and Property ID');
            return;
        }
        setLoading(true);
        try {
            // API_BASE_URL injected via config
            const res = await fetch(`${API_BASE_URL}/api/channex/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: apiToken, propertyMappingId })
            });
            const text = await res.text();
            if (!text) throw new Error('Empty response from server');
            const json = JSON.parse(text);
            if (json.success) {
                alert('Connection Successful! Found ' + json.count + ' active channels.');
            } else {
                alert('Connection Failed: ' + json.error);
            }
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        if (!user?.propertyId) return;
        setLoading(true);

        // Verify with Backend first
        try {
            // API_BASE_URL injected via config
            const verifyRes = await fetch(`${API_BASE_URL}/api/channex/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: apiToken, propertyMappingId })
            });

            const verifyText = await verifyRes.text();
            if (!verifyText) throw new Error('Empty response from server');
            const verifyJson = JSON.parse(verifyText);
            if (!verifyJson.success) {
                alert(`Connection Failed: ${verifyJson.error}`);
                setLoading(false);
                return;
            }

            // Save to DB if verified
            const payload = {
                property_id: user.propertyId,
                channel_name: 'channex',
                api_key: apiToken,
                property_mapping_id: propertyMappingId,
                is_active: true,
                status: 'Connected',
                last_sync: new Date().toISOString()
            };

            if (channexConfig?.id) {
                await supabase.from('channel_settings').update(payload).eq('id', channexConfig.id);
            } else {
                await supabase.from('channel_settings').insert(payload);
            }

            await fetchConfiguration();
            setIsEditing(false);
            alert(`Connected! Found ${verifyJson.count} active channels.`);

        } catch (e: any) {
            alert('Error saving configuration: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            // API_BASE_URL injected via config
            const res = await fetch(`${API_BASE_URL}/api/channex/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ property_id: user?.propertyId })
            });
            const text = await res.text();
            if (!text) throw new Error('Empty response from server');
            const json = JSON.parse(text);

            if (json.success) {
                alert(json.message);
                await fetchConfiguration(); // Refresh timestamp in UI
            } else {
                alert('Sync failed: ' + json.error);
            }
        } catch (e: any) {
            console.error(e);
            alert('Sync error: ' + e.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleSaveMappings = async () => {
        if (!user?.propertyId) return;
        setSavingMappings(true);
        try {
            // API_BASE_URL injected via config
            const res = await fetch(`${API_BASE_URL}/api/channex/mappings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: user.propertyId,
                    mappings: mappings
                })
            });

            const text = await res.text();
            if (!text) throw new Error('Empty response from server');
            const json = JSON.parse(text);
            if (json.success) {
                alert("Mappings saved successfully!");
            } else {
                alert("Failed to save mappings: " + json.error);
            }
        } catch (e: any) {
            console.error(e);
            alert("Error saving mappings: " + e.message);
        } finally {
            setSavingMappings(false);
        }
    };

    if (loading && !channexConfig && !isEditing) return <div className="p-4"><Loader className="animate-spin" /></div>;

    return (
        <Card title="Channel Manager (via Channex.io)" action={
            channexConfig?.is_active && (
                <Button variant="outline" icon={Globe} onClick={handleSync} disabled={syncing}>
                    {syncing ? 'Syncing...' : 'Force Sync'}
                </Button>
            )
        }>
            {!channexConfig || isEditing ? (
                <div className="space-y-4 max-w-xl mx-auto py-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                        <h4 className="font-semibold text-blue-900 mb-1">Connect to Channex</h4>
                        <p className="text-sm text-blue-700">
                            Enter your Channex.io API Token and Property ID to enable synchronization.
                        </p>
                    </div>

                    <Input
                        label="Channex API Token"
                        value={apiToken}
                        onChange={e => setApiToken(e.target.value)}
                        type="password"
                        placeholder="e.g. uB/MonlYXk..."
                    />
                    <Input
                        label="Channex Property ID"
                        value={propertyMappingId}
                        onChange={e => setPropertyMappingId(e.target.value)}
                        placeholder="e.g. property_xyz"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        {channexConfig && <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>}
                        <Button variant="outline" onClick={handleTestConnection} disabled={loading}>
                            Test Connection
                        </Button>
                        <Button onClick={handleSaveConfig} disabled={loading}>
                            {loading ? 'Saving...' : 'Save & Connect'}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Status Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <h3 className="font-bold text-green-900">System Online</h3>
                                </div>
                                <Button size="sm" variant="ghost" className="text-green-700 hover:bg-green-100 h-8" onClick={() => setIsEditing(true)}>
                                    Edit Config
                                </Button>
                            </div>
                            <p className="text-green-700 text-sm mb-1">
                                Property ID: <span className="font-mono bg-green-100 px-1 rounded">{channexConfig.property_mapping_id}</span>
                            </p>
                            <p className="text-green-600 text-xs">Last Synced: {new Date(channexConfig.last_sync || '').toLocaleString()}</p>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Active Channels</p>
                                <p className="text-2xl font-bold text-slate-800">{activeChannels.filter(c => c.status === 'Active').length}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">Mapped Rooms</p>
                                <p className="text-2xl font-bold text-slate-800">{Object.keys(mappings).length}/{localRoomTypes.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Room Mapping Section */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">1</span>
                            Room Type Mapping
                        </h4>
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Local Room Type</th>
                                        <th className="px-4 py-3 font-medium">Channex Room Type</th>
                                        <th className="px-4 py-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {localRoomTypes.length === 0 ? (
                                        <tr><td colSpan={3} className="p-4 text-center text-slate-400">No local rooms found. Create rooms in Room Wizard first.</td></tr>
                                    ) : (
                                        localRoomTypes.map(localType => (
                                            <tr key={localType} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium text-slate-700">{localType}</td>
                                                <td className="px-4 py-3">
                                                    <select
                                                        className="w-full max-w-xs p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                                                        value={mappings[localType] || ''}
                                                        onChange={(e) => setMappings(prev => ({ ...prev, [localType]: e.target.value }))}
                                                    >
                                                        <option value="">-- Select Channex Room --</option>
                                                        {channexRooms.map((cr: any) => (
                                                            <option key={cr.id} value={cr.id}>{cr.attributes.title} ({cr.id})</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {mappings[localType] ? (
                                                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">Mapped</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Unmapped</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {localRoomTypes.length > 0 && (
                                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                                    <Button onClick={handleSaveMappings} disabled={savingMappings}>
                                        {savingMappings ? 'Saving Mappings...' : 'Save Mappings'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Channels Grid */}
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">2</span>
                            Active Distribution Channels
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {activeChannels.map(c => (
                                <div key={c.name} className="p-4 border border-slate-200 rounded-lg flex items-center justify-between bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{c.name}</p>
                                            <p className={`text-xs ${c.status === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>
                                                ● {c.status}
                                            </p>
                                        </div>
                                    </div>
                                    {c.status === 'Active' && <Badge color="green">Live</Badge>}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-4 text-center">
                            Manage individual channel connections and mappings directly in your <a href="#" className="underline hover:text-slate-600">Channex Dashboard</a>.
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
};

const PropertyManagement: React.FC = () => {
    const { user } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        timezone: 'Pacific Time (PT)'
    });

    useEffect(() => {
        if (user?.propertyId) {
            fetchProperty();
        } else {
            setInitialLoading(false);
        }
    }, [user]);

    const fetchProperty = async () => {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('id', user?.propertyId)
                .single();

            if (error) throw error;

            if (data) {
                setProperty(data);
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '+1 (555) 123-4567',
                    location: data.location || '123 Luxury Blvd, Metropolis',
                    timezone: 'Pacific Time (PT)' // Default or fetch if column exists
                });
            }
        } catch (err: any) {
            console.error('Error fetching property:', err);
            setError(err.message);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSaveProperty = async () => {
        if (!user?.propertyId) return;
        setLoading(true);

        try {
            const { error } = await supabase
                .from('properties')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    location: formData.location
                    // timezone is likely local-only or needs a column
                })
                .eq('id', user.propertyId);

            if (error) throw error;
            alert('Property settings saved successfully!');
            await fetchProperty();

        } catch (error: any) {
            console.error('Error saving property:', error);
            alert(`Failed to save settings: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleDemoMode = async () => {
        if (!property || !user?.propertyId) return;

        const newStatus = !property.demo_mode;

        if (newStatus === false) {
            // Turning OFF Demo Mode -> Wipe Data
            const confirmWipe = window.confirm(
                "⚠️ WARNING: Disabling Demo Mode will PERMANENTLY DELETE all mock data (Reservations, Rooms, Guests, Staff) for this property to give you a fresh start.\n\nAre you sure you want to proceed?"
            );
            if (!confirmWipe) return;
        }

        setSaving(true);
        try {
            // 1. Update Property Status
            const { error: updateError } = await supabase
                .from('properties')
                .update({ demo_mode: newStatus })
                .eq('id', user.propertyId);

            if (updateError) throw updateError;

            // 2. If turning OFF demo mode, wipe related data
            if (newStatus === false) {
                console.log("Wiping demo data...");
                await supabase.from('reservations').delete().eq('property_id', user.propertyId);
                await supabase.from('rooms').delete().eq('property_id', user.propertyId);
                await supabase.from('guests').delete().eq('property_id', user.propertyId);
                await supabase.from('staff').delete().eq('property_id', user.propertyId);
            }

            // 3. Refresh
            await fetchProperty();
            alert(`Demo Mode ${newStatus ? 'Enabled' : 'Disabled'}. ${newStatus ? '' : 'All mock data has been cleared.'}`);

        } catch (err: any) {
            console.error(err);
            alert("Error updating Demo Mode: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!user?.propertyId) return <div className="p-4">No property assigned.</div>;
    if (initialLoading) return <div className="p-4 flex items-center gap-2"><Loader className="animate-spin" /> Loading property details...</div>;
    if (error) return <div className="p-4 text-red-500">Error loading property: {error}</div>;
    if (!property) return <div className="p-4">Property not found.</div>;


    return (
        <Card title="Property Configuration">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Property Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Contact Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                        label="Location/Address"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                    <Select
                        label="Time Zone"
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    >
                        <option>Pacific Time (PT)</option>
                        <option>Eastern Time (ET)</option>
                        <option>Central Time (CT)</option>
                    </Select>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-medium text-slate-800 mb-4">Application Settings</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-700">Demo Mode</p>
                                <p className="text-sm text-slate-500">
                                    {property.demo_mode
                                        ? "Currently using mock data. Turn off to go live."
                                        : "Live Production Mode. Data is real."}
                                </p>
                            </div>
                            <button
                                onClick={handleToggleDemoMode}
                                disabled={saving}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 ${property.demo_mode ? 'bg-gold-50' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${property.demo_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-slate-700">Maintenance Mode</p>
                                <p className="text-sm text-slate-500">Disable customer-facing booking engine</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300">
                                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProperty} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

// --- Main Page Component ---

const SuperAdminConsole: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [newPropertyName, setNewPropertyName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        const { data, error } = await supabase.from('properties').select('*');
        if (!error && data) setProperties(data);
    };

    const handleCreateProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.from('properties').insert([
                { name: newPropertyName, created_at: new Date().toISOString() }
            ]);

            if (error) throw error;

            setMessage('Property created successfully!');
            setNewPropertyName('');
            fetchProperties();
        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Super Admin Console (Global)</h2>
            {/* ... simplified console for brevity if needed ... */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Create New Property</h3>
                <form onSubmit={handleCreateProperty} className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="New Property Name"
                        value={newPropertyName}
                        onChange={(e) => setNewPropertyName(e.target.value)}
                        required
                        className="flex-grow"
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Property'}
                    </Button>
                </form>
                {message && (
                    <p className={`mt-2 text-sm ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
                        {message}
                    </p>
                )}
            </div>

            <div className="mt-8">
                <UserAssignment properties={properties} />
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">Existing Properties</h3>
                <ul className="list-disc pl-5">
                    {properties.map((property) => (
                        <li key={property.id} className="text-slate-700">
                            {property.name} <span className="text-xs text-slate-400">({property.id})</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

interface UserAssignmentProps {
    properties: Property[];
}

const UserAssignment: React.FC<UserAssignmentProps> = ({ properties }) => {
    const [email, setEmail] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFeedback('');

        try {
            // Logic to update user mapping
            const { data: users, error: searchError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (searchError || !users) throw new Error('User not found');

            const { error: updateError } = await supabase
                .from('users')
                .update({ property_id: selectedPropertyId })
                .eq('id', users.id);

            if (updateError) throw updateError;
            setFeedback('User assigned successfully!');
        } catch (err: any) {
            setFeedback(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Assign User to Property">
            <form onSubmit={handleAssign} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="User Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Select Property</label>
                        <select className="w-full p-2 border rounded-md" value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)} required>
                            <option value="">-- Choose --</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Assigning...' : 'Assign'}</Button>
            </form>
            {feedback && <p className="mt-2 text-sm">{feedback}</p>}
        </Card>
    );
}

const SystemLogs: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterLevel, setFilterLevel] = useState('ALL');

    useEffect(() => {
        fetchLogs();
        // Removed Realtime listener for system_logs to prevent database DoS
    }, [filterLevel, user?.propertyId]);

    const fetchLogs = async () => {
        setLoading(true);
        let query = supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(100);

        if (filterLevel !== 'ALL') {
            query = query.eq('level', filterLevel);
        }

        // Scope logs if strictly not a super admin (though this component should only be visible to admins)
        if (!user?.isAdmin && user?.propertyId) {
            query = query.eq('property_id', user.propertyId);
        }

        const { data } = await query;
        if (data) setLogs(data);
        setLoading(false);
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
            case 'ERROR': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <Card title="System Logs & Audits" action={
            <div className="flex gap-2">
                <select
                    className="text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                >
                    <option value="ALL">All Levels</option>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="ERROR">Error</option>
                    <option value="CRITICAL">Critical</option>
                </select>
                <Button variant="outline" onClick={fetchLogs} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
            </div>
        }>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Level</th>
                            <th className="px-6 py-3">Event</th>
                            <th className="px-6 py-3">Message</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                    {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getLevelColor(log.level)}`}>
                                        {log.level}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">{log.event || log.type}</td>
                                <td className="px-6 py-4 text-slate-600">{log.message}</td>
                                <td className="px-6 py-4 text-xs text-slate-400 font-mono max-w-xs truncate">
                                    {JSON.stringify(log.details)}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No logs found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const FeatureRequests: React.FC = () => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Low');
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data } = await supabase.from('feature_requests').select('*').order('created_at', { ascending: false });
        if (data) setRequests(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.from('feature_requests').insert([{
            user_id: user?.id,
            property_id: user?.propertyId,
            title,
            description,
            priority
        }]);

        if (error) {
            alert('Error submitting request: ' + error.message);
        } else {
            alert('Feature request submitted successfully!');
            setTitle('');
            setDescription('');
            fetchRequests();
        }
        setLoading(false);
    };

    return (
        <Card title="Feature Requests & Feedback">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submission Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-2">Submit a Request</h3>
                        <p className="text-sm text-slate-500 mb-4">Help us improve StaySync by suggesting new features or reporting issues.</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Dark Mode" required />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select className="w-full p-2 border rounded-md" value={priority} onChange={e => setPriority(e.target.value)}>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-2 border border-slate-300 rounded-md h-32 focus:ring-purple-500 focus:border-purple-500"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    placeholder="Describe the feature..."
                                />
                            </div>
                            <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
                        </form>
                    </div>
                </div>

                {/* List of Requests */}
                <div className="lg:col-span-2">
                    <h3 className="font-semibold text-slate-800 mb-4">Recent Requests</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {requests.map(req => (
                            <div key={req.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-purple-100 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-900">{req.title}</h4>
                                        <p className="text-sm text-slate-600 mt-1">{req.description}</p>
                                        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className={`px-2 py-0.5 rounded-full ${req.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                                req.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>{req.priority}</span>
                                        </div>
                                    </div>
                                    <Badge color={req.status === 'Completed' ? 'green' : req.status === 'Planned' ? 'purple' : 'gray'}>
                                        {req.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {requests.length === 0 && <p className="text-center text-slate-500 py-8">No requests yet. Be the first!</p>}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const AdminSettings: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = !!user?.isAdmin;
    const isManager = !!user?.isManager;
    const isManagement = isManager || isAdmin;

    const [activeTab, setActiveTab] = useState<'database' | 'users' | 'property' | 'rooms' | 'channel' | 'superadmin' | 'updates' | 'features' | 'logs'>('property');
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['database', 'users', 'property', 'rooms', 'channel', 'superadmin', 'updates', 'features', 'logs'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    return (
        <div className="space-y-6 animate-fadeIn transition-all duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
                    <p className="text-slate-500">Manage system settings, users, and inspect data</p>
                    {/* Debug Info */}
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                        User: {user?.email} | Admin: {user?.isAdmin ? 'TRUE' : 'FALSE'} | Prop: {user?.propertyId || 'NONE'} | ID: {user?.id}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge color="blue">{isAdmin ? 'Super Admin' : 'Manager'}</Badge>
                    <Badge color="green">System Healthy</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="col-span-1 space-y-2">
                    <nav className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        {isAdmin && (
                            <button onClick={() => setActiveTab('superadmin')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'superadmin' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> <span className="font-medium">Super Admin</span></div>
                            </button>
                        )}
                        <button onClick={() => setActiveTab('property')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'property' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3"><Building className="w-5 h-5" /> <span className="font-medium">Property Details</span></div>
                        </button>
                        {isManagement && (
                            <>
                                <button onClick={() => setActiveTab('users')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'users' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><Users className="w-5 h-5" /> <span className="font-medium">Staff Members</span></div>
                                </button>
                                <button onClick={() => setActiveTab('rooms')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'rooms' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><Layout className="w-5 h-5" /> <span className="font-medium">Rooms & Units</span></div>
                                </button>
                                <button onClick={() => setActiveTab('channel')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'channel' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><Globe className="w-5 h-5" /> <span className="font-medium">Channel Manager</span></div>
                                </button>
                            </>
                        )}
                        <button onClick={() => setActiveTab('updates')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'updates' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3"><GitBranch className="w-5 h-5" /> <span className="font-medium">System Updates</span></div>
                        </button>
                        <button onClick={() => setActiveTab('features')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'features' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3"><Users className="w-5 h-5" /> <span className="font-medium">Feature Requests</span></div>
                        </button>
                        {/* Database Inspector - STRICTLY ADMIN ONLY */}
                        {isAdmin && (
                            <button onClick={() => setActiveTab('database')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'database' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3"><Database className="w-5 h-5" /> <span className="font-medium">Data Inspector</span></div>
                            </button>
                        )}
                        {isAdmin && (
                            <button onClick={() => setActiveTab('logs')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-all ${activeTab === 'logs' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> <span className="font-medium">System Logs</span></div>
                            </button>
                        )}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="col-span-1 md:col-span-3">
                    {activeTab === 'property' && <PropertyManagement />}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'rooms' && <RoomWizard />}
                    {activeTab === 'channel' && <ChannelManager />}
                    {activeTab === 'superadmin' && isAdmin && <SuperAdminConsole />}
                    {activeTab === 'database' && isAdmin && <DatabaseInspector />}
                    {activeTab === 'updates' && <CommitTracker />}
                    {activeTab === 'features' && <FeatureRequests />}
                    {activeTab === 'logs' && isAdmin && <SystemLogs />}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;


function setLoading(_arg0: boolean) {
    throw new Error('Function not implemented.');
}

