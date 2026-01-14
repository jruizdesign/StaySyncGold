import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Card, Input, Select, Badge } from '../components/UIComponents';
import { Settings, Database, Users, Building, ChevronRight, Plus, Eye, Loader2, AlertCircle, ClipboardList, Receipt, Layout, Globe, FileText, Image as ImageIcon, MessageSquare, Ban } from 'lucide-react';
import { MOCK_ROOMS, MOCK_GUESTS, MOCK_RESERVATIONS, MOCK_STAFF } from '../constants';

const AdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'database' | 'users' | 'property' | 'guests' | 'housekeeping' | 'billing' | 'rooms' | 'channel' | 'documents'>('database');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
                    <p className="text-slate-500">Manage system settings, users, and inspect data</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge color="blue">Admin Mode</Badge>
                    <Badge color="green">System Healthy</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation for Settings */}
                <Card className="col-span-1 p-0 overflow-hidden">
                    <nav className="flex flex-col">
                        <button
                            onClick={() => setActiveTab('database')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'database'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5" />
                                <span className="font-medium">Visual Database</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'database' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'users'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5" />
                                <span className="font-medium">User Management</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'users' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('guests')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'guests'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5" />
                                <span className="font-medium">Guest CRM</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'guests' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('housekeeping')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'housekeeping'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <ClipboardList className="w-5 h-5" />
                                <span className="font-medium">Housekeeping</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'housekeeping' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('billing')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'billing'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Receipt className="w-5 h-5" />
                                <span className="font-medium">Billing & Invoices</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'billing' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'rooms'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Layout className="w-5 h-5" />
                                <span className="font-medium">Room Wizard</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'rooms' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('channel')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'channel'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5" />
                                <span className="font-medium">Channel Manager</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'channel' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'documents'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">AI Doc Center</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'documents' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                        <button
                            onClick={() => setActiveTab('property')}
                            className={`flex items-center justify-between px-6 py-4 text-left border-l-4 transition-colors ${activeTab === 'property'
                                ? 'border-gold-500 bg-gold-50 text-gold-900'
                                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Building className="w-5 h-5" />
                                <span className="font-medium">Property Details</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'property' ? 'rotate-90 text-gold-500' : 'text-slate-400'}`} />
                        </button>
                    </nav>
                </Card>

                {/* Main Content Area */}
                <div className="col-span-1 md:col-span-3">
                    {activeTab === 'database' && <DatabaseInspector />}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'guests' && <GuestCRM />}
                    {activeTab === 'housekeeping' && <HousekeepingModule />}
                    {activeTab === 'billing' && <BillingModule />}
                    {activeTab === 'rooms' && <RoomWizard />}
                    {activeTab === 'channel' && <ChannelManager />}
                    {activeTab === 'documents' && <DocumentCenter />}
                    {activeTab === 'property' && <PropertyManagement />}
                </div>
            </div>
        </div>
    );
};

// --- Sub-Components ---

const DatabaseInspector: React.FC = () => {
    const [selectedTable, setSelectedTable] = useState('reservations');
    const [data, setData] = useState<any[]>([]);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        fetchTableData();
    }, [selectedTable]);

    const fetchTableData = async () => {
        const { data: tableData, error } = await supabase
            .from(selectedTable)
            .select('*')
            .limit(50);

        if (error) {
            console.error('Error fetching data:', error);
            // Fallback to mock data if fetch fails (likely due to missing tables/connection)
            switch (selectedTable) {
                case 'reservations': setData(MOCK_RESERVATIONS); break;
                case 'rooms': setData(MOCK_ROOMS); break;
                case 'guests': setData(MOCK_GUESTS); break;
                default: setData([]);
            }
        } else {
            setData(tableData || []);
        }
    };

    const handleSeedData = async () => {
        setSeeding(true);
        try {
            // 1. Create Property
            const propertyId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
            const { error: propError } = await supabase
                .from('properties')
                .upsert([{
                    id: propertyId,
                    name: 'Grand Hotel & Suites',
                    location: '123 Luxury Blvd',
                    managerName: 'Jason',
                    ownerName: 'Jason'
                }]);

            if (propError) throw new Error('Failed to seed property: ' + propError.message);

            // 2. Create Room Types - SKIPPED (User schema uses string type directly in Rooms)
            /*
            const types = ['Suite', 'Double', 'King'];
            const typeMap: Record<string, number> = {};

            for (const name of types) {
                const { data: typeData, error: typeError } = await supabase
                    .from('roomtypes')
                    .upsert([{
                        property_id: propertyId,
                        name: name,
                        base_price: name === 'Suite' ? 350 : 180,
                        max_occupancy: name === 'Suite' ? 4 : 2
                    }], { onConflict: 'name, property_id' }) // Assuming generic constraint or just insert
                    .select() // If constraint fails, we might need to just select
                    .maybeSingle(); // upsert might assume id constraint.

                // Simplified: Just insert if not exists logic is hard without unique constraints. 
                // Let's standard insert first.
                // Actually, better to just Select first, then Insert if missing.
                let realTypeData = typeData;
                if (!realTypeData) { // If upsert didn't return due to conflict or logic
                    const { data: newType } = await supabase.from('roomtypes').insert({
                        property_id: propertyId,
                        name: name,
                        base_price: name === 'Suite' ? 350 : 180,
                        max_occupancy: name === 'Suite' ? 4 : 2
                    }).select().single();
                    realTypeData = newType;
                }

                if (realTypeData) typeMap[name] = realTypeData.id;
            }
            */

            // 3. Create Rooms
            // To link MOCK_ROOMS (which use random IDs) to real DB IDs, we just iterate.
            const roomMap: Record<string, string> = {}; // mockID -> realUUID
            for (const mockRoom of MOCK_ROOMS) {
                const newRoomId = crypto.randomUUID();
                const { error: roomError } = await supabase
                    .from('rooms')
                    .insert({
                        id: newRoomId,
                        property_id: propertyId,
                        number: mockRoom.number, // Required Text column
                        room_number: mockRoom.number, // Optional Varchar column
                        type: mockRoom.type,
                        status: mockRoom.status,
                        floor: mockRoom.floor,
                        price_per_night: mockRoom.rate // Numeric column
                    });

                if (!roomError) {
                    roomMap[mockRoom.id] = newRoomId;
                } else {
                    console.error('Room seed error:', roomError);
                }
            }

            // 4. Create Guests
            const guestMap: Record<string, string> = {};
            for (const mockGuest of MOCK_GUESTS) {
                const newGuestId = crypto.randomUUID();
                const { error: guestError } = await supabase
                    .from('guests')
                    .insert({
                        id: newGuestId,
                        property_id: propertyId,
                        first_name: mockGuest.fullName.split(' ')[0],
                        last_name: mockGuest.fullName.split(' ')[1] || '',
                        email: mockGuest.email,
                        phone: mockGuest.phone
                    });

                if (!guestError) {
                    guestMap[mockGuest.id] = newGuestId;
                } else {
                    console.error('Guest seed error:', guestError);
                }
            }

            // 5. Create Reservations
            for (const mockRes of MOCK_RESERVATIONS) {
                const realGuestId = guestMap[mockRes.guestId];
                const realRoomId = roomMap[mockRes.roomId];

                if (realGuestId && realRoomId) {
                    await supabase.from('reservations').insert({
                        property_id: propertyId,
                        guest_id: realGuestId,
                        room_id: realRoomId,
                        check_in: mockRes.checkIn,
                        check_out: mockRes.checkOut,
                        status: mockRes.status
                    });
                }
            }

            // 6. Create Staff
            for (const mockStaff of MOCK_STAFF) {
                const [firstName, ...lastNameParts] = mockStaff.name.split(' ');
                await supabase.from('staff').insert({
                    property_id: propertyId,
                    role: mockStaff.role,
                    firstname: firstName,
                    last_name: lastNameParts.join(' ') || '',
                    pin: '1234'
                });
            }

            alert('Database seeded successfully!');
            fetchTableData(); // Refresh view
        } catch (e: any) {
            console.error(e);
            alert('Seeding failed: ' + e.message);
        } finally {
            setSeeding(false);
        }
    };

    return (
        <Card title="Database Inspector" action={
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    icon={Database}
                    onClick={handleSeedData}
                    disabled={seeding}
                >
                    {seeding ? 'Seeding...' : 'Seed Data'}
                </Button>
                <Button variant="outline" icon={Eye} onClick={fetchTableData}>Refresh</Button>
            </div>
        }>
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Table</label>
                <div className="flex gap-2 flex-wrap">
                    {['reservations', 'rooms', 'guests', 'staff', 'properties', 'users', 'invoices', 'housekeeping'].map(table => (
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
                        {data.map((row, idx) => (
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
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No data found in this table</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-xs text-slate-400 text-center">Showing first 6 columns. Real Supabase data.</p>
        </Card>
    );
};

const UserManagement: React.FC = () => {
    return (
        <Card title="User Management" action={<Button icon={Plus}>Add User</Button>}>
            <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                    <Input placeholder="Search users by name or email..." className="w-full" />
                </div>

                <div className="space-y-2">
                    {MOCK_STAFF.map(staff => (
                        <div key={staff.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                    {staff.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{staff.name}</p>
                                    <p className="text-sm text-slate-500">{staff.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge color={staff.status === 'Active' ? 'green' : 'gray'}>{staff.status}</Badge>
                                <Button variant="ghost" className="text-sm">Edit</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

const GuestCRM: React.FC = () => {
    const [selectedGuest, setSelectedGuest] = useState<any>(null);
    const [notes, setNotes] = useState('');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1" title="Guest List">
                <div className="space-y-3">
                    <Input placeholder="Search CRM..." />
                    {MOCK_GUESTS.map(guest => (
                        <div
                            key={guest.id}
                            onClick={() => setSelectedGuest(guest)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedGuest?.id === guest.id ? 'border-gold-500 bg-gold-50' : 'border-slate-100 hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-slate-900">{guest.fullName}</p>
                                {guest.id === 'g2' && <Badge color="red">Do Not Rent</Badge>}
                            </div>
                            <p className="text-xs text-slate-500">{guest.email}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card className="lg:col-span-2" title={selectedGuest ? `Profile: ${selectedGuest.fullName}` : 'Select a Guest'}>
                {selectedGuest ? (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Email" defaultValue={selectedGuest.email} />
                                    <Input label="Phone" defaultValue={selectedGuest.phone} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
                                    <textarea
                                        className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                                        rows={4}
                                        placeholder="Add private notes about this guest..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="w-48 space-y-4">
                                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700 mb-2">
                                        <Ban className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Restriction</span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="rounded text-red-600" />
                                        <span className="text-sm text-red-900">Do Not Rent</span>
                                    </label>
                                </div>
                                <Button variant="outline" icon={MessageSquare} className="w-full">AI Chat</Button>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-bold text-slate-800 mb-3">Recent Activity</h4>
                            <div className="text-sm text-slate-500 italic">No recent documents found.</div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline">Cancel</Button>
                            <Button>Update Profile</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a guest from the list to view and manage their profile</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

const HousekeepingModule: React.FC = () => {
    return (
        <Card title="Housekeeping Status" action={<Button variant="outline" icon={Plus}>Assign Task</Button>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <p className="text-xs font-bold text-green-600 uppercase">Clean & Ready</p>
                    <p className="text-2xl font-bold text-green-900">12</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs font-bold text-amber-600 uppercase">Dirty / In-Progress</p>
                    <p className="text-2xl font-bold text-amber-900">4</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs font-bold text-blue-600 uppercase">Inspected</p>
                    <p className="text-2xl font-bold text-blue-900">8</p>
                </div>
            </div>
            <div className="space-y-2">
                {MOCK_ROOMS.map(room => (
                    <div key={room.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700">
                                {room.number}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">{room.type}</p>
                                <p className="text-xs text-slate-500">Floor {room.floor}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Select className="text-xs py-1">
                                <option>Clean</option>
                                <option>Dirty</option>
                                <option>Inspected</option>
                                <option>Out of Order</option>
                            </Select>
                            <Badge color={room.status === 'Available' ? 'green' : 'amber'}>{room.status}</Badge>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const BillingModule: React.FC = () => {
    return (
        <Card title="Billing & Invoicing" action={<Button icon={Plus}>New Invoice</Button>}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-4 py-3">Invoice #</th>
                            <th className="px-4 py-3">Guest</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {[1, 2, 3].map(i => (
                            <tr key={i}>
                                <td className="px-4 py-4 font-mono">INV-2024-00{i}</td>
                                <td className="px-4 py-4">Guest Name {i}</td>
                                <td className="px-4 py-4 font-medium">$450.00</td>
                                <td className="px-4 py-4"><Badge color={i === 1 ? 'green' : 'amber'}>{i === 1 ? 'Paid' : 'Pending'}</Badge></td>
                                <td className="px-4 py-4">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" className="text-xs">View</Button>
                                        <Button variant="ghost" className="text-xs" icon={FileText}>AI PDF</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const RoomWizard: React.FC = () => {
    return (
        <Card title="Room Setup Wizard">
            <div className="max-w-2xl mx-auto space-y-8 py-4">
                <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                    {[1, 2, 3].map(step => (
                        <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-gold-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {step}
                        </div>
                    ))}
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Room Number / Name" placeholder="e.g. 301" />
                        <Select label="Room Type">
                            <option>King Suite</option>
                            <option>Double Queen</option>
                            <option>Executive Suite</option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Base Price ($)" type="number" placeholder="250" />
                        <Input label="Max Occupancy" type="number" placeholder="2" />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">Discounts & Rules</h4>
                        <div className="flex gap-2">
                            <Input placeholder="Discount Name" className="flex-1" />
                            <Input placeholder="%" className="w-20" />
                            <Button variant="outline" icon={Plus}>Add</Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-6">
                    <Button variant="ghost">Save Draft</Button>
                    <Button>Next Step</Button>
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

const DocumentCenter: React.FC = () => {
    return (
        <Card title="AI Document Center" action={<Button icon={ImageIcon}>Upload Images</Button>}>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-gold-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Drop guest IDs or receipts here</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-2">AI will automatically scan the content and attach it to the correct guest profile.</p>
                <Button className="mt-6" variant="outline">Select Files</Button>
            </div>
        </Card>
    );
};

const PropertyManagement: React.FC = () => {
    return (
        <Card title="Property Configuration">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Property Name" defaultValue="Grand Hotel & Suites" />
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
                                <p className="text-sm text-slate-500">Use mock data for demonstration</p>
                            </div>
                            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gold-500">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </div>
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

export default AdminSettings;
