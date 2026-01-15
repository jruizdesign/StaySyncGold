import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Card, Input, Select, Badge } from '../components/UIComponents';
import { Settings, Database, Users, Building, ShieldCheck, Plus, Search, ChevronRight, Layout, Globe, Loader, GitBranch } from 'lucide-react';
import { Property } from '../types';
import { useAuth } from '../context/AuthContext';
import { CommitTracker } from '../components/CommitTracker';

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
                address: p.address,
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

    return (
        <Card title="Database Inspector (Scoped)" action={<Button variant="outline" onClick={fetchTableData}>Refresh</Button>}>
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
        <Card title="Staff Management" action={<Button icon={Plus}>Add Staff</Button>}>
            <div className="space-y-4">
                {/* Search bar placeholder */}

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
                                <Badge color="green">Active</Badge> {/* Mock status status */}
                                <Button variant="ghost" className="text-sm">Edit</Button>
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
    const [price, setPrice] = useState('200');
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
                price_per_night: parseFloat(price),
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
                        value={price}
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
    return (
        <Card title="Channel Manager" action={<Button variant="outline" icon={Globe}>Sync All</Button>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Booking.com', 'Expedia', 'Airbnb', 'Direct Website'].map(channel => (
                    <div key={channel} className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Globe className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{channel}</p>
                                <p className="text-xs text-green-600">Connected & Syncing</p>
                            </div>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gold-500">
                            <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const PropertyManagement: React.FC = () => {
    const { user } = useAuth();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.propertyId) fetchProperty();
    }, [user]);

    const fetchProperty = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', user?.propertyId)
            .single();

        if (data) setProperty(data);
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

        setLoading(true);
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
            setLoading(false);
        }
    };

    if (!user?.propertyId) return <div className="p-4">No property assigned.</div>;
    if (!property) return <div className="p-4 flex items-center gap-2"><Loader className="animate-spin" /> Loading property details...</div>;

    return (
        <Card title="Property Configuration">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Property Name" defaultValue={property.name} />
                    <Input label="Contact Phone" defaultValue="+1 (555) 123-4567" />
                    <Input label="Address" defaultValue="123 Luxury Blvd, Metropolis" />
                    <Select label="Time Zone">
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
                                disabled={loading}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 ${property.demo_mode ? 'bg-gold-500' : 'bg-slate-200'}`}
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
                    <Button>Save Changes</Button>
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

const AdminSettings: React.FC = () => {
    const { user } = useAuth(); // Global Auth

    // Determine permissions based on user role (Mock or real)
    // If user.isAdmin exists -> Super Admin
    // If user.propertyId exists -> Manager/Owner of that property
    const isAdmin = !!user?.isAdmin;
    const isManager = !!user?.isManager;
    const isManagement = isManager || isAdmin; // Managers and Admins can see property settings

    const [activeTab, setActiveTab] = useState<'database' | 'users' | 'property' | 'rooms' | 'channel' | 'superadmin' | 'updates'>('property');

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
                <Card className="col-span-1 p-0 overflow-hidden">
                    <nav className="flex flex-col">
                        {isAdmin && (
                            <button onClick={() => setActiveTab('superadmin')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'superadmin' ? 'border-purple-500 bg-purple-50' : 'border-transparent hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> <span className="font-medium">Super Admin</span></div>
                            </button>
                        )}
                        <button onClick={() => setActiveTab('property')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'property' ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3"><Building className="w-5 h-5" /> <span className="font-medium">Property Details</span></div>
                        </button>
                        {isManagement && (
                            <>
                                <button onClick={() => setActiveTab('users')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'users' ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><Users className="w-5 h-5" /> <span className="font-medium">Staff Members</span></div>
                                </button>
                                <button onClick={() => setActiveTab('rooms')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'rooms' ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><Layout className="w-5 h-5" /> <span className="font-medium">Rooms & Units</span></div>
                                </button>
                                <button onClick={() => setActiveTab('channel')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'channel' ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><Globe className="w-5 h-5" /> <span className="font-medium">Channel Manager</span></div>
                                </button>
                            </>
                        )}
                        <button onClick={() => setActiveTab('updates')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'updates' ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3"><GitBranch className="w-5 h-5" /> <span className="font-medium">System Updates</span></div>
                        </button>
                        {/* Database Inspector - STRICTLY ADMIN ONLY */}
                        {isAdmin && (
                            <button onClick={() => setActiveTab('database')} className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'database' ? 'border-gold-500 bg-gold-50' : 'border-transparent hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3"><Database className="w-5 h-5" /> <span className="font-medium">Data Inspector</span></div>
                            </button>
                        )}
                    </nav>
                </Card>

                {/* Main Content Area */}
                <div className="col-span-1 md:col-span-3">
                    {activeTab === 'database' && <DatabaseInspector />}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'rooms' && <RoomWizard />}
                    {activeTab === 'channel' && <ChannelManager />}
                    {activeTab === 'property' && <PropertyManagement />}
                    {activeTab === 'updates' && <CommitTracker />}
                    {activeTab === 'superadmin' && isAdmin && <SuperAdminConsole />}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
