import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, Button, Badge } from '../components/UIComponents';
import { Clock, Calendar, ChevronLeft, ChevronRight, User, AlertCircle, Loader } from 'lucide-react';
import { StaffShift, Staff } from '../types';

const ManagerTimeTracking: React.FC = () => {
    const { user } = useAuth();
    const [shifts, setShifts] = useState<(StaffShift & { staff: Staff })[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });

    useEffect(() => {
        fetchData();
    }, [currentDate, user?.propertyId]);

    const fetchData = async () => {
        if (!user?.propertyId) return;
        setLoading(true);

        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch Shifts for the day
        const { data: shiftData, error } = await supabase
            .from('staff_shifts')
            .select('*, staff:staff_id(*)')
            .eq('property_id', user.propertyId)
            .gte('clock_in', startOfDay.toISOString())
            .lte('clock_in', endOfDay.toISOString())
            .order('clock_in', { ascending: false });

        if (!error && shiftData) {
            setShifts(shiftData as any);
        }

        // TODO: Calculate advanced stats here or via separate queries

        setLoading(false);
    };

    const calculateDuration = (inTime: string, outTime?: string) => {
        if (!outTime) return 'Active';
        const start = new Date(inTime).getTime();
        const end = new Date(outTime).getTime();
        const diff = end - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Time Tracking & Audit</h1>
                    <p className="text-slate-500 mt-1">Review staff hours, edit logs, and track performance.</p>
                </div>
                <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 items-center">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-4 font-medium text-slate-700 min-w-[140px] text-center flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(currentDate)}
                    </div>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : shifts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No shifts found</h3>
                    <p className="text-slate-500">There are no clock-in records for this date.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Clock In</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Clock Out</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shifts.map((shift) => (
                                <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                {shift.staff?.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{shift.staff?.name}</p>
                                                <p className="text-xs text-slate-500">{shift.staff?.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-numeric">
                                        {new Date(shift.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-numeric">
                                        {shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge color={shift.status === 'active' ? 'green' : shift.status === 'on_break' ? 'amber' : 'gray'}>
                                            {shift.status === 'active' ? 'Active' : shift.status === 'on_break' ? 'On Break' : 'Completed'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                        {calculateDuration(shift.clock_in, shift.clock_out)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => alert('Editing coming soon')}>Edit</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManagerTimeTracking;
