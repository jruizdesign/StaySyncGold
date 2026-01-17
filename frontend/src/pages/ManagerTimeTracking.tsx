import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, Button, Input, Modal } from '../components/UIComponents';
import { Clock, Calendar, ChevronLeft, ChevronRight, Edit2, User } from 'lucide-react';
import { StaffShift, Staff } from '../types';

interface AttendanceLog {
    id: string;
    originalId: string; // shift_id or break_id
    staffName: string;
    time: string;
    action: 'CLOCK IN' | 'CLOCK OUT' | 'START BREAK' | 'END BREAK';
    notes?: string;
    type: 'shift' | 'break';
    field: 'clock_in' | 'clock_out' | 'start_time' | 'end_time';
}

const ManagerTimeTracking: React.FC = () => {
    const { user } = useAuth();

    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'roster' | 'logs'>('roster'); // Defaulting to roster for dev flow

    // Staff Roster State
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [staffForm, setStaffForm] = useState({
        firstname: '',
        last_name: '',
        email: '',
        role: 'Front Desk',
        pin: '',
        status: 'active'
    });

    // Edit Modal State
    const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
    const [editTime, setEditTime] = useState('');

    useEffect(() => {
        if (view === 'logs') {
            fetchLogs();
        } else if (view === 'roster') {
            fetchStaff();
        }
    }, [currentDate, user?.propertyId, view]);

    const fetchStaff = async () => {
        if (!user?.propertyId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('property_id', user.propertyId)
                .order('role');

            if (error) throw error;
            setStaffList(data || []);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!user?.propertyId) return;
        setLoading(true);

        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            // Fetch Shifts
            const { data: shiftData, error: shiftError } = await supabase
                .from('staff_shifts')
                .select('*, staff:staff_id(name, firstname, last_name)')
                .eq('property_id', user.propertyId)
                .or(`clock_in.gte.${startOfDay.toISOString()},clock_out.gte.${startOfDay.toISOString()}`);

            if (shiftError) throw shiftError;

            // Fetch Breaks linked to these shifts
            const shiftIds = shiftData?.map(s => s.id) || [];
            let breakData: any[] = [];

            if (shiftIds.length > 0) {
                const { data: breaks, error: breakError } = await supabase
                    .from('staff_breaks')
                    .select('*')
                    .in('shift_id', shiftIds);
                if (breakError) throw breakError;
                breakData = breaks || [];
            }

            // Flatten to logs
            const allLogs: AttendanceLog[] = [];

            shiftData?.forEach((shift: any) => {
                const staffName = shift.staff?.name || `${shift.staff?.firstname || ''} ${shift.staff?.last_name || ''}`.trim() || 'Unknown';

                // Clock In
                if (new Date(shift.clock_in) >= startOfDay && new Date(shift.clock_in) <= endOfDay) {
                    allLogs.push({
                        id: `in_${shift.id}`,
                        originalId: shift.id,
                        staffName,
                        time: shift.clock_in,
                        action: 'CLOCK IN',
                        type: 'shift',
                        field: 'clock_in'
                    });
                }

                // Clock Out
                if (shift.clock_out && new Date(shift.clock_out) >= startOfDay && new Date(shift.clock_out) <= endOfDay) {
                    allLogs.push({
                        id: `out_${shift.id}`,
                        originalId: shift.id,
                        staffName,
                        time: shift.clock_out,
                        action: 'CLOCK OUT',
                        type: 'shift',
                        field: 'clock_out'
                    });
                }
            });

            breakData.forEach((brk: any) => {
                // Find associated staff name from shiftData
                const shift = shiftData?.find((s: any) => s.id === brk.shift_id);
                const staffName = shift?.staff?.name || `${shift?.staff?.firstname || ''} ${shift?.staff?.last_name || ''}`.trim() || 'Unknown';

                // Start Break
                if (new Date(brk.start_time) >= startOfDay && new Date(brk.start_time) <= endOfDay) {
                    allLogs.push({
                        id: `brk_start_${brk.id}`,
                        originalId: brk.id,
                        staffName,
                        time: brk.start_time,
                        action: 'START BREAK',
                        type: 'break',
                        field: 'start_time'
                    });
                }

                // End Break
                if (brk.end_time && new Date(brk.end_time) >= startOfDay && new Date(brk.end_time) <= endOfDay) {
                    allLogs.push({
                        id: `brk_end_${brk.id}`,
                        originalId: brk.id,
                        staffName,
                        time: brk.end_time,
                        action: 'END BREAK',
                        type: 'break',
                        field: 'end_time'
                    });
                }
            });

            // Sort by time descending
            allLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setLogs(allLogs);

        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (log: AttendanceLog) => {
        // Convert ISO string to "YYYY-MM-DDTHH:mm" for input type="datetime-local"
        const d = new Date(log.time);
        const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setEditTime(localIso);
        setEditingLog(log);
    };

    const saveEdit = async () => {
        if (!editingLog || !editTime) return;

        try {
            // Convert local input back to ISO UTC
            const newDate = new Date(editTime).toISOString();

            const table = editingLog.type === 'shift' ? 'staff_shifts' : 'staff_breaks';

            const { error } = await supabase
                .from(table)
                .update({ [editingLog.field]: newDate })
                .eq('id', editingLog.originalId);

            if (error) throw error;

            setEditingLog(null);
            fetchLogs(); // Refresh
        } catch (err) {
            console.error('Error updating log:', err);
            alert('Failed to update log');
        }
    };

    // --- Staff Management Logic ---

    const openAddStaffModal = () => {
        setEditingStaff(null);
        setStaffForm({
            firstname: '',
            last_name: '',
            email: '',
            role: 'Front Desk',
            pin: '', // Default empty
            status: 'active'
        });
        setIsStaffModalOpen(true);
    };

    const openEditStaffModal = (staff: Staff) => {
        setEditingStaff(staff);
        setStaffForm({
            firstname: staff.firstname,
            last_name: staff.last_name,
            email: staff.email || '',
            role: staff.role as any,
            pin: staff.pin || '',
            status: staff.status as any
        });
        setIsStaffModalOpen(true);
    };

    const handleSaveStaff = async () => {
        if (!user?.propertyId) return;
        if (!staffForm.firstname || !staffForm.last_name || !staffForm.pin) {
            alert('Please fill in Name and PIN');
            return;
        }

        try {
            if (editingStaff) {
                // Update
                const { error } = await supabase
                    .from('staff')
                    .update({
                        firstname: staffForm.firstname,
                        last_name: staffForm.last_name,
                        email: staffForm.email,
                        role: staffForm.role,
                        pin: staffForm.pin,
                        status: staffForm.status
                    })
                    .eq('id', editingStaff.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from('staff')
                    .insert({
                        property_id: user.propertyId,
                        firstname: staffForm.firstname,
                        last_name: staffForm.last_name,
                        email: staffForm.email,
                        role: staffForm.role,
                        pin: staffForm.pin,
                        status: staffForm.status
                    });
                if (error) throw error;
            }

            setIsStaffModalOpen(false);
            fetchStaff();
        } catch (err) {
            console.error('Error saving staff:', err);
            alert('Failed to save staff');
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                <div className="flex gap-8">
                    <button
                        onClick={() => setView('roster')}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${view === 'roster' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Staff Roster
                    </button>
                    <button
                        onClick={() => setView('logs')}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${view === 'logs' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Attendance Logs
                    </button>
                </div>
                <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                    onClick={openAddStaffModal}
                >
                    + Add Staff Member
                </Button>
            </div>

            {view === 'logs' && (
                <div className="space-y-6">
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-400" />
                            Attendance History
                        </h2>

                        <div className="flex gap-4">
                            {/* Date Picker */}
                            <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1 items-center">
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="px-4 font-medium text-slate-700 min-w-[140px] text-center flex items-center justify-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {formatDate(currentDate)}
                                </div>
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Staff Filter */}
                            <div className="bg-white border border-slate-200 rounded-lg px-4 flex items-center gap-2 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:border-slate-300">
                                <User className="w-4 h-4 text-slate-400" />
                                All Staff
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff Member</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">No records found for this date</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 text-sm font-mono text-slate-600">
                                                {new Date(log.time).toLocaleDateString()} | {new Date(log.time).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800">
                                                {log.staffName}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">
                                                {log.action}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 italic">
                                                {log.notes || ''}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEdit(log)}
                                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'roster' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-slate-400" />
                            Staff Directory
                        </h2>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff Member</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && staffList.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">Loading staff...</td></tr>
                                ) : staffList.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">No staff members found</td></tr>
                                ) : (
                                    staffList.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                        {(staff.firstname?.[0] || staff.name?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">
                                                            {staff.name || `${staff.firstname} ${staff.last_name}`}
                                                        </div>
                                                        <div className="text-xs text-slate-400">ID: {staff.pin_code ? '***' : 'No PIN'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {staff.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${staff.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {staff.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {staff.email || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openEditStaffModal(staff)}
                                                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Attendance Log Modal */}
            <Modal isOpen={!!editingLog} onClose={() => setEditingLog(null)} title="Edit Attendance Log">
                <div className="p-4 pt-0">
                    <p className="mb-4 text-sm text-slate-500">
                        Editing <strong>{editingLog?.action}</strong> for <strong>{editingLog?.staffName}</strong>.
                    </p>

                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Timestamp</label>
                    <Input
                        type="datetime-local"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="mb-8"
                    />

                    <div className="flex gap-3 justify-end">
                        <Button variant="ghost" onClick={() => setEditingLog(null)}>Cancel</Button>
                        <Button onClick={saveEdit}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

            {/* Add/Edit Staff Modal */}
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={editingStaff ? "Edit Staff Member" : "Add Staff Member"}>
                <div className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={staffForm.firstname}
                            onChange={(e) => setStaffForm({ ...staffForm, firstname: e.target.value })}
                            placeholder="e.g. John"
                        />
                        <Input
                            label="Last Name"
                            value={staffForm.last_name}
                            onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                            placeholder="e.g. Doe"
                        />
                    </div>

                    <Input
                        label="Email Address (Optional)"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        placeholder="john.doe@example.com"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                value={staffForm.role}
                                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                            >
                                <option value="Front Desk">Front Desk</option>
                                <option value="Housekeeping">Housekeeping</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Manager">Manager</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                value={staffForm.status}
                                onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value as any })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-900 mb-2">Kiosk Access PIN</label>
                        <p className="text-xs text-slate-500 mb-2">Used for clocking in/out on the staff kiosk.</p>
                        <Input
                            type="text"
                            maxLength={4}
                            placeholder="0000"
                            value={staffForm.pin}
                            onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                            className="text-center text-2xl tracking-[0.5em] font-mono font-bold"
                        />
                    </div>

                    <div className="flex gap-3 justify-end mt-8">
                        <Button variant="ghost" onClick={() => setIsStaffModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveStaff} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            {editingStaff ? 'Update Staff' : 'Create Staff'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ManagerTimeTracking;
