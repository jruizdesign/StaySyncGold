import React, { useState, useEffect } from 'react';
import { Card, Button, Modal } from '../components/UIComponents';
import StaffCard from '../components/StaffCard';
import { Clock, LogOut, ArrowLeft, Loader, Coffee, Play, Pause, ChevronLeft, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Staff, StaffShift } from '../types';

const ShiftTimer: React.FC<{ startTime: string }> = ({ startTime }) => {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDuration(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [startTime]);

  return <h3 className="text-3xl font-bold text-slate-800">{duration}</h3>;
};

const LuminaClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <>
      <span className="text-white">{hours}:{minutes}</span>
      <span className="text-3xl text-slate-500 font-bold self-end mb-2">:{seconds}</span>
    </>
  );
};

const RealtimeClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl text-white shadow-lg border border-slate-700">
      <h2 className="text-5xl font-mono font-bold tracking-wider text-gold-500">
        {time.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </h2>
      <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-sm">
        {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
};

const StaffKiosk: React.FC = () => {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [currentShift, setCurrentShift] = useState<StaffShift | null>(null);
  const [view, setView] = useState<'grid' | 'personal'>('grid');

  const [stats, setStats] = useState({ active: 0, onBreak: 0 });

  useEffect(() => {
    fetchStaff();
    fetchStats();

    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user?.propertyId]);

  const fetchStats = async () => {
    if (!user?.propertyId) return;
    try {
      // Get active shifts (status='active')
      const { count: activeCount, error: activeError } = await supabase
        .from('staff_shifts')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', user.propertyId)
        .eq('status', 'active')
        .is('clock_out', null);

      // Get break shifts (status='on_break')
      const { count: breakCount, error: breakError } = await supabase
        .from('staff_shifts')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', user.propertyId)
        .eq('status', 'on_break')
        .is('clock_out', null);

      if (activeError) throw activeError;
      if (breakError) throw breakError;

      setStats({
        active: activeCount || 0,
        onBreak: breakCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchStaff = async () => {
    if (!user?.propertyId) return;
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('property_id', user.propertyId);

      if (error) throw error;

      // Map DB fields to UI type if needed
      const mappedData = (data || []).map((s: any) => ({
        ...s,
        name: s.name || `${s.firstname || ''} ${s.last_name || ''}`.trim() || 'Unknown Staff'
      }));

      // Sort by name
      mappedData.sort((a: Staff, b: Staff) => a.name.localeCompare(b.name));

      setStaffList(mappedData);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentShift = async (staffId: string) => {
    // Find active shift (not completed)
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .select('*')
        .eq('staff_id', staffId)
        .is('clock_out', null) // Still open
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
      setCurrentShift(data || null);
    } catch (err) {
      console.error('Error fetching shift:', err);
    }
  };

  const handleStaffClick = (staff: Staff) => {
    setSelectedStaff(staff);
    setPin('');
    setError('');
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (!selectedStaff || !user?.propertyId) return;

    // In real app, verify PIN securely. For demo, matching local state or assuming success if non-empty
    // Simple check against fetched staff record (WARNING: Sensitive data should be handled carefully)
    // Here we assume the staff record fetched includes the 'pin' field.
    // If Supabase RLS policies are good, we can verify by trying to SELECT with PIN match.

    // Re-verify with DB to be safe
    const { data } = await supabase
      .from('staff')
      .select('id')
      .eq('id', selectedStaff.id)
      .eq('pin', pin)
      .single();

    if (!data) {
      setError('Invalid PIN');
      setPin('');
      return;
    }

    setShowPinModal(false);
    await fetchCurrentShift(selectedStaff.id);
    setView('personal');
  };

  const handleClockIn = async () => {
    if (!selectedStaff || !user?.propertyId) return;
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .insert({
          staff_id: selectedStaff.id,
          property_id: user.propertyId,
          status: 'active',
          clock_in: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentShift(data);
      // Update local staff list status for UI immediately?
    } catch (err) {
      console.error('Clock in error:', err);
      alert('Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!currentShift) return;
    try {
      const { error } = await supabase
        .from('staff_shifts')
        .update({
          clock_out: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', currentShift.id);

      if (error) throw error;
      setCurrentShift(null);
      // Auto-return to grid after a delay?
      setTimeout(() => setView('grid'), 2000);
    } catch (err) {
      console.error('Clock out error:', err);
    }
  };

  const handleBreak = async (start: boolean) => {
    if (!currentShift) return;
    const newStatus = start ? 'on_break' : 'active';

    try {
      // Update main shift status
      const { error: shiftError } = await supabase
        .from('staff_shifts')
        .update({ status: newStatus })
        .eq('id', currentShift.id);

      if (shiftError) throw shiftError;

      if (start) {
        // Create break record
        await supabase
          .from('staff_breaks')
          .insert({
            shift_id: currentShift.id,
            start_time: new Date().toISOString()
          });
      } else {
        // Close open break record
        // Find the open break for this shift
        const { data: openBreak } = await supabase
          .from('staff_breaks')
          .select('id')
          .eq('shift_id', currentShift.id)
          .is('end_time', null)
          .single();

        if (openBreak) {
          await supabase
            .from('staff_breaks')
            .update({ end_time: new Date().toISOString() })
            .eq('id', openBreak.id);
        }
      }

      // Refresh shift
      setCurrentShift(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Break toggle error:', err);
    }
  };

  const renderPersonalDashboard = () => (
    <div className="max-w-6xl mx-auto w-full animate-fadeIn pb-20">
      <button onClick={() => setView('grid')} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="w-5 h-5" /> Back to Staff List
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Identity & Time */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-1 shadow-xl shadow-slate-200/50">
            {selectedStaff && (
              <StaffCard
                staff={selectedStaff}
                onClick={() => { }} // No-op for display
                status={currentShift ? currentShift.status as any : 'idle'}
              />
            )}
          </div>

          <RealtimeClock />

          <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Current Status</h3>
            <div className={`p-4 rounded-xl flex items-center gap-3 ${!currentShift ? 'bg-slate-100 text-slate-500' :
              currentShift.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
              <div className={`w-3 h-3 rounded-full ${!currentShift ? 'bg-slate-400' :
                currentShift.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                  'bg-amber-500 animate-pulse'
                }`} />
              <span className="font-bold text-lg">
                {!currentShift ? 'Off Duty' : currentShift.status === 'active' ? 'Active Shift' : 'On Break'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 h-full flex flex-col">
            <div className="p-8 flex-1 flex flex-col justify-center">
              {!currentShift ? (
                <button onClick={handleClockIn} className="w-full py-12 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-2xl flex flex-col items-center justify-center gap-4 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40">
                  <Clock className="w-16 h-16" />
                  <div className="text-center">
                    <span className="block text-3xl font-bold">Start Shift</span>
                    <span className="text-emerald-100">Record accurate start time</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => handleBreak(currentShift.status === 'active')}
                    className={`w-full py-8 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.99] ${currentShift.status === 'active'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                      }`}
                  >
                    {currentShift.status === 'active' ? <Coffee className="w-10 h-10" /> : <Play className="w-10 h-10" />}
                    <span className="text-2xl font-bold">{currentShift.status === 'active' ? 'Start Break' : 'End Break'}</span>
                  </button>

                  <button
                    onClick={handleClockOut}
                    className="w-full py-8 bg-rose-500 hover:bg-rose-600 active:scale-[0.99] text-white rounded-2xl flex flex-col items-center justify-center gap-3 transition-all shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40"
                  >
                    <LogOut className="w-10 h-10" />
                    <span className="text-2xl font-bold">End Shift</span>
                  </button>

                  {/* Stats Card */}
                  <Card className="flex flex-col justify-center items-center bg-slate-50 border-none shadow-inner py-6 mt-4">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-1">Shift Duration</p>
                    <ShiftTimer startTime={currentShift.clock_in} />
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-40 bg-white/80 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-gold-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Staff Kiosk</h1>
            <p className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <Link to="/" className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Exit Kiosk
        </Link>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {view === 'grid' ? (
          <div className="max-w-6xl mx-auto">
            {/* Lumina Kiosk Banner */}
            <div className="bg-[#0B1120] rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">

                {/* Left Side: Title & Stats */}
                <div className="flex-1">
                  <h1 className="text-4xl font-black tracking-tight mb-2">STAFF KIOSK</h1>
                  <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-8">
                    Property Staff Verification Engine
                  </p>

                  <div className="flex gap-4">
                    {/* Active Duty Stat */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 min-w-[140px] backdrop-blur-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Duty</p>
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-2xl font-bold">
                          {stats.active}
                        </span>
                      </div>
                    </div>

                    {/* On Break Stat */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 min-w-[140px] backdrop-blur-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">On Break</p>
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-2xl font-bold">
                          {stats.onBreak}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Large Clock */}
                <div className="text-right">
                  <div className="font-mono text-8xl font-bold tracking-tighter leading-none flex items-baseline justify-end gap-2">
                    {/* We can use the RealtimeClock component logic here or inline it for custom styling */}
                    <LuminaClock />
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 text-emerald-500/80">
                    <div className="w-3 h-3 border-2 border-current rounded-[3px] flex items-center justify-center">
                      <div className="w-1.5 h-2 bg-current rounded-t-[1px]" />
                      {/* Simple lock icon representation or use Lucide */}
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Secure Terminal Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {staffList.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No Staff Members Found</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                  There are no staff members associated with this property yet.
                  Please go to the <Link to="/staff" className="text-gold-600 hover:text-gold-700 font-semibold">Staff Management</Link> page to add your team.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {staffList.map(staff => (
                  <StaffCard
                    key={staff.id}
                    staff={staff}
                    onClick={() => handleStaffClick(staff)}
                    // In real app, fetch and pass actual status per card or via context. 
                    // For now, idle default.
                    status="idle"
                  />
                ))}
              </div>
            )}

            <div className="mt-12 text-center opacity-50 hover:opacity-100 transition-opacity">
              <Link to="/" className="inline-flex items-center text-slate-400 hover:text-slate-600 font-medium transition-colors text-sm">
                Manager Access
              </Link>
            </div>
          </div>
        ) : (
          renderPersonalDashboard()
        )}
      </div>

      <Modal isOpen={showPinModal} onClose={() => setShowPinModal(false)} title={`Enter PIN for ${selectedStaff?.name}`}>
        <div className="p-4 pt-0">
          <div className="flex justify-center gap-4 mb-8 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-12 h-14 rounded-lg flex items-center justify-center text-2xl font-bold transition-all border-2 ${pin.length > i
                ? 'border-gold-500 bg-gold-50 text-gold-600 scale-105'
                : 'border-slate-100 bg-slate-50 text-slate-300'
                }`}>
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => setPin(p => p.length < 4 ? p + num : p)}
                className="h-14 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 text-xl font-semibold text-slate-700 transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <div className="col-span-1"></div>
            <button
              onClick={() => setPin(p => p.length < 4 ? p + '0' : p)}
              className="h-14 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 text-xl font-semibold text-slate-700 transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={() => setPin(p => p.slice(0, -1))}
              className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all flex items-center justify-center active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {error && <p className="text-red-500 text-center mt-6 font-medium text-sm animate-pulse">{error}</p>}

          <div className="mt-8">
            <Button
              className="w-full py-4 text-lg"
              disabled={pin.length !== 4}
              onClick={handlePinSubmit}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </div >
  );
};

export default StaffKiosk;