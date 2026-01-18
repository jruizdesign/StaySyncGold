import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, Button, Input, Select, Badge } from '../components/UIComponents';
import { Plus, Wrench, AlertTriangle, CheckCircle, Clock, Sparkles } from 'lucide-react';

interface MaintenanceTicket {
    id: string;
    room_id: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Open' | 'In Progress' | 'Resolved';
    created_at: string;
    category?: string;
    ai_summary?: string;
    suggested_action?: string;
    rooms?: {
        number: string;
    };
}

const Maintenance: React.FC = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [rooms, setRooms] = useState<{ id: string; number: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form State
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [priority, setPriority] = useState<string>('Medium');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user?.propertyId) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Tickets
            const { data: ticketData, error: ticketError } = await supabase
                .from('maintenance')
                .select('*, rooms(number)')
                .eq('property_id', user?.propertyId)
                .order('created_at', { ascending: false });

            if (ticketError) throw ticketError;
            setTickets(ticketData || []);

            // Fetch Rooms for Dropdown
            const { data: roomData, error: roomError } = await supabase
                .from('rooms')
                .select('id, number')
                .eq('property_id', user?.propertyId)
                .order('number');

            if (roomError) throw roomError;
            setRooms(roomData || []);
        } catch (error) {
            console.error('Error fetching maintenance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const { error } = await supabase.from('maintenance').insert([
                {
                    property_id: user?.propertyId,
                    room_id: selectedRoomId,
                    description,
                    priority,
                    status: 'Open'
                }
            ]);

            if (error) throw error;

            // Reset and Refresh
            setShowCreateForm(false);
            setDescription('');
            setSelectedRoomId('');
            setPriority('Medium');
            fetchData();
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Failed to create ticket');
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('maintenance')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return 'red';
            case 'Medium': return 'yellow';
            case 'Low': return 'blue';
            default: return 'gray';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'Open': return 'red';
            case 'In Progress': return 'yellow';
            case 'Resolved': return 'green';
            default: return 'gray';
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Maintenance Data...</div>;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Maintenance & Repairs</h1>
                    <p className="text-slate-500">Track and manage property issues</p>
                </div>
                <Button icon={Plus} onClick={() => setShowCreateForm(!showCreateForm)}>
                    {showCreateForm ? 'Cancel' : 'New Ticket'}
                </Button>
            </div>

            {showCreateForm && (
                <Card title="Log New Issue">
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Room</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    value={selectedRoomId}
                                    onChange={e => setSelectedRoomId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Room --</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>Room {r.number}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Priority</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                        <Input
                            label="Description"
                            placeholder="Describe the issue..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={creating}>
                                {creating ? 'Logging...' : 'Log Issue'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {tickets.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">All Systems Go</h3>
                        <p className="text-slate-500">No open maintenance tickets found.</p>
                    </div>
                ) : (
                    tickets.map(ticket => (
                        <div key={ticket.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${ticket.priority === 'Critical' ? 'bg-red-100 text-red-600 animate-pulse' :
                                        ticket.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                                            ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                                'bg-blue-100 text-blue-600'
                                        }`}>
                                        <Wrench className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-slate-900 text-lg">Room {ticket.rooms?.number || 'N/A'}</h3>
                                            <Badge color={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                                            <Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                                            {ticket.category && (
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tighter">
                                                    {ticket.category}
                                                </span>
                                            )}
                                        </div>

                                        {/* AI Summary or Description */}
                                        {ticket.ai_summary ? (
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                                                    <span className="text-purple-500"><Sparkles className="w-3.5 h-3.5" /></span>
                                                    {ticket.ai_summary}
                                                </p>
                                                {ticket.suggested_action && (
                                                    <p className="text-xs text-slate-500 mt-1 pl-5">
                                                        <span className="font-bold uppercase text-[10px] tracking-wide text-slate-400">Action: </span>
                                                        {ticket.suggested_action}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-slate-600 text-sm">{ticket.description}</p>
                                        )}

                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Reported {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:self-center ml-16 md:ml-0">
                                    {ticket.status !== 'Resolved' ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="p-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={ticket.status}
                                                onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Mark Resolved</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-1 text-emerald-600 font-medium text-sm bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                            <CheckCircle className="w-4 h-4" /> Resolved
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Maintenance;
