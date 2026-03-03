import React, { useState, useEffect } from 'react';
import { Card, Button, Modal } from '../components/UIComponents';
import StaffCard from '../components/StaffCard';
import { Clock, LogOut, ArrowLeft, Loader, Coffee, Play, ChevronLeft, Search, User, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Staff, StaffShift } from '../types';

// --- Sub-Components ---

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
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{duration}</h3>;
};

const BigClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-[8rem] leading-none font-bold tracking-tighter text-white font-mono">
        {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
      </h2>
      <p className="text-2xl text-slate-400 font-medium uppercase tracking-[0.2em] mt-2">
        {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
};

// --- Main Layout ---

const StaffKiosk: React.FC = () => {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth State
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [currentShift, setCurrentShift] = useState<StaffShift | null>(null);

  // Initial Load
  useEffect(() => {
    fetchStaff();
  }, [user?.propertyId]);

  // Search Filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredStaff(staffList);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredStaff(staffList.filter(s =>
        (s.name || '').toLowerCase().includes(lower) ||
        (s.firstname || '').toLowerCase().includes(lower)
      ));
    }
  }, [searchQuery, staffList]);

  // Reset state when selecting new staff
  useEffect(() => {
    if (selectedStaff) {
      setPin('');
      setAuthError('');
      setIsAuthenticated(false);
      setCurrentShift(null);
    }
  }, [selectedStaff]);

  const fetchStaff = async () => {
    if (!user?.propertyId) return;
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('property_id', user.propertyId);

      if (error) throw error;

      const mappedData = (data || []).map((s: any) => ({
        ...s,
        name: s.name || `${s.firstname || ''} ${s.last_name || ''}`.trim() || 'Unknown Staff'
      }));

      mappedData.sort((a: Staff, b: Staff) => (a.name || '').localeCompare(b.name || ''));
      setStaffList(mappedData);
      setFilteredStaff(mappedData);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentShift = async (staffId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_shifts')
        .select('*')
        .eq('staff_id', staffId)
        .is('clock_out', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentShift(data || null);
    } catch (err) {
      console.error('Error fetching shift:', err);
    }
  };

  const handlePinSubmit = async () => {
    if (!selectedStaff || !user?.propertyId) return;

    // Verify PIN against DB
    const { data, error } = await supabase.rpc('verify_staff_pin', {
      staff_id_param: selectedStaff.id,
      pin_param: pin
    });

    if (error || !data) {
      setAuthError('Invalid PIN');
      setPin('');
      return;
    }

    await fetchCurrentShift(selectedStaff.id);
    setIsAuthenticated(true);
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

      // Logout after clock out
      setTimeout(() => {
        setSelectedStaff(null);
      }, 1500);
      setCurrentShift(null); // Clear UI immediately to show filtered state
    } catch (err) {
      console.error('Clock out error:', err);
    }
  };

  const handleBreak = async (start: boolean) => {
    if (!currentShift) return;
    const newStatus = start ? 'on_break' : 'active';

    try {
      const { error: shiftError } = await supabase
        .from('staff_shifts')
        .update({ status: newStatus })
        .eq('id', currentShift.id);

      if (shiftError) throw shiftError;

      if (start) {
        await supabase.from('staff_breaks').insert({
          shift_id: currentShift.id,
          start_time: new Date().toISOString()
        });
      } else {
        const { data: openBreak } = await supabase
          .from('staff_breaks')
          .select('id')
          .eq('shift_id', currentShift.id)
          .is('end_time', null)
          .single();

        if (openBreak) {
          await supabase.from('staff_breaks').update({ end_time: new Date().toISOString() }).eq('id', openBreak.id);
        }
      }

      setCurrentShift(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Break toggle error:', err);
    }
  };

  const handleLogout = () => {
    setSelectedStaff(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-gold-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 grid grid-cols-12 overflow-hidden font-sans">

      {/* --- LEFT COLUMN: Staff List --- */}
      <div className="col-span-4 border-r border-slate-800 bg-slate-900 flex flex-col h-screen">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <Link to="/dashboard" className="flex items-center text-slate-400 hover:text-white mb-6 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit Kiosk
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Staff Access</h1>
          <p className="text-slate-500 text-sm mb-4">Select your profile to begin</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No staff found</p>
            </div>
          ) : (
            filteredStaff.map(staff => (
              <button
                key={staff.id}
                onClick={() => setSelectedStaff(staff)}
                className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all border ${selectedStaff?.id === staff.id
                  ? 'bg-gold-500 text-white border-gold-400 shadow-lg shadow-gold-500/20'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                  }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${selectedStaff?.id === staff.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                  {staff.firstname?.[0]}{staff.last_name?.[0]}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">{staff.firstname} {staff.last_name}</h3>
                  <p className={`text-sm ${selectedStaff?.id === staff.id ? 'text-gold-100' : 'text-slate-500'}`}>{staff.role}</p>
                </div>
                {selectedStaff?.id === staff.id && <ChevronLeft className="w-5 h-5 ml-auto rotate-180" />}
              </button>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT COLUMN: Workspace --- */}
      <div className="col-span-8 bg-slate-950 relative flex flex-col h-screen">
        {!selectedStaff ? (
          // STATE: IDLE
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-fadeIn">
            <div className="mb-12">
              <BigClock />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Terminal Locked</h3>
              <p className="text-slate-500">Please select your profile from the list on the left to clock in or manage your shift.</p>
            </div>
          </div>
        ) : !isAuthenticated ? (
          // STATE: PIN ENTRY
          <div className="flex-1 flex flex-col items-center justify-center p-12 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-gold-500 border-4 border-slate-700">
                {selectedStaff.firstname?.[0]}{selectedStaff.last_name?.[0]}
              </div>
              <h2 className="text-3xl font-bold text-white">Welcome, {selectedStaff.firstname}</h2>
              <p className="text-slate-400 mt-2">Enter your PIN to continue</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-[400px] w-full">
              {/* PIN Display */}
              <div className="flex justify-center gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-14 h-16 rounded-xl flex items-center justify-center text-3xl font-bold transition-all border-2 ${pin.length > i
                    ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                    : 'border-slate-700 bg-slate-800 text-slate-600'
                    }`}>
                    {pin.length > i && '•'}
                  </div>
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPin(p => p.length < 4 ? p + num : p)}
                    className="h-20 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-gold-500 active:text-white border border-slate-700 text-2xl font-bold text-white transition-all shadow-lg active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <div className="col-span-1"></div>
                <button
                  onClick={() => setPin(p => p.length < 4 ? p + '0' : p)}
                  className="h-20 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-gold-500 active:text-white border border-slate-700 text-2xl font-bold text-white transition-all shadow-lg active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={() => setPin(p => p.slice(0, -1))}
                  className="h-20 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all flex items-center justify-center active:scale-95"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
              </div>

              {authError && <p className="text-red-500 text-center mb-4 animate-shake font-medium">{authError}</p>}

              <button
                onClick={handlePinSubmit}
                disabled={pin.length !== 4}
                className="w-full py-4 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:hover:bg-gold-500 text-white font-bold rounded-xl text-lg transition-colors"
              >
                Verify Identity
              </button>
            </div>
          </div>
        ) : (
          // STATE: AUTHENTICATED DASHBOARD
          <div className="flex-1 p-12 flex flex-col animate-slideUp">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Hello, {selectedStaff.firstname}</h2>
                <p className="text-slate-400 text-lg">
                  {currentShift ? 'You are currently clocked in.' : 'Ready to start your shift?'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 flex-1">
              {/* Left: Status Card */}
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col">
                <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm mb-6">Current Status</h3>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-2xl ${!currentShift ? 'bg-slate-800 text-slate-500' :
                    currentShift.status === 'active' ? 'bg-emerald-500 text-white shadow-emerald-500/50 animate-pulse-slow' :
                      'bg-amber-500 text-white shadow-amber-500/50 animate-pulse-slow'
                    }`}>
                    {!currentShift ? <Clock className="w-12 h-12" /> :
                      currentShift.status === 'active' ? <Clock className="w-12 h-12" /> :
                        <Coffee className="w-12 h-12" />
                    }
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {!currentShift ? 'Off Duty' : currentShift.status === 'active' ? 'Active Shift' : 'On Break'}
                  </h2>
                  {currentShift && (
                    <div className="bg-slate-800 px-6 py-3 rounded-xl mt-4 border border-slate-700">
                      <ShiftTimer startTime={currentShift.clock_in} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="space-y-6 flex flex-col">
                {!currentShift ? (
                  <button
                    onClick={handleClockIn}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all shadow-xl shadow-emerald-900/20 group"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <span className="block text-3xl font-bold">Start Shift</span>
                      <span className="text-emerald-100">Record start time</span>
                    </div>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleBreak(currentShift.status === 'active')}
                      className={`flex-1 rounded-3xl p-6 flex items-center justify-center gap-6 transition-all shadow-xl active:scale-[0.98] ${currentShift.status === 'active'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                        }`}
                    >
                      {currentShift.status === 'active' ? <Coffee className="w-12 h-12" /> : <Play className="w-12 h-12" />}
                      <div className="text-left">
                        <span className="block text-2xl font-bold">{currentShift.status === 'active' ? 'Start Break' : 'End Break'}</span>
                        <span className="opacity-80">Pause tracking</span>
                      </div>
                    </button>

                    <button
                      onClick={handleClockOut}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white rounded-3xl p-6 flex items-center justify-center gap-6 transition-all shadow-xl shadow-rose-900/20"
                    >
                      <LogOut className="w-12 h-12" />
                      <div className="text-left">
                        <span className="block text-2xl font-bold">End Shift</span>
                        <span className="text-rose-100">Clock out now</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffKiosk;