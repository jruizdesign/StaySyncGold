import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wand2, BedDouble, AlertCircle, Loader } from 'lucide-react';
import { RoomStatus, Room } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Housekeeping: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = [
    { label: 'ALL', value: 'ALL' },
    { label: 'Clean', value: 'Clean' },
    { label: 'Dirty', value: 'Dirty' },
    { label: 'Inspect', value: 'Inspect' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'Occupied', value: 'Occupied' },
  ];

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    setLoading(true);
    if (!user?.propertyId) {
      setRooms([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', user.propertyId)
      .order('number');

    if (error) {
      console.error('Error fetching rooms:', error);
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (roomId: string, newStatus: RoomStatus) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId);

      if (error) throw error;

      // Optimistic update
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update room status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case RoomStatus.CLEAN: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case RoomStatus.DIRTY: return 'bg-rose-100 text-rose-800 border-rose-200';
      case RoomStatus.OOO: return 'bg-amber-100 text-amber-800 border-amber-200';
      case RoomStatus.INSPECT: return 'bg-blue-100 text-blue-800 border-blue-200';
      case RoomStatus.OCCUPIED: return 'bg-slate-900 text-white border-slate-900';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    if (status === RoomStatus.OOO) return 'Maintenance';
    return status;
  };

  // Correctly filter based on RoomStatus enum values
  const filteredRooms = filter === 'ALL'
    ? rooms
    : rooms.filter(r => {
      if (filter === 'Maintenance') return r.status === RoomStatus.OOO;
      return r.status === filter;
    });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader className="animate-spin w-8 h-8 text-slate-400" /></div>;
  }

  if (!user?.propertyId && !user?.isAdmin) {
    return <div className="p-8 text-center text-slate-500">Please contact an administrator to be assigned to a property.</div>;
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Property Manager</h1>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>

      {/* Sub Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Room Operations</h2>
          <p className="text-slate-500 text-sm mt-1">Inventory and housekeeping status</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin?tab=rooms')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-purple-200">
            <Wand2 className="w-4 h-4" />
            Run Setup Wizard
          </button>
          <button onClick={() => navigate('/admin?tab=rooms')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Room
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f.value
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-md transition-shadow">
            {/* Card Header */}
            <div className="p-5 flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500">
                  <BedDouble className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{room.number}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {room.type} • Floor {room.floor || 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Bar */}
            <div className="px-5 pb-5">
              <div className={`w-full py-2.5 rounded-lg text-center font-bold text-sm border ${getStatusColor(room.status)}`}>
                {getStatusDisplay(room.status)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-slate-100 divide-x divide-slate-100 bg-slate-50/50">
              <button
                onClick={() => handleUpdateStatus(room.id, RoomStatus.CLEAN)}
                className="flex-1 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                disabled={room.status === RoomStatus.CLEAN}
              >
                Mark Clean
              </button>
              <button
                onClick={() => handleUpdateStatus(room.id, RoomStatus.DIRTY)}
                className="flex-1 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                disabled={room.status === RoomStatus.DIRTY}
              >
                Mark Dirty
              </button>
            </div>
          </div>
        ))}
        {filteredRooms.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-500">
            <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No rooms found matching this filter.</p>
          </div>
        )}
      </div>

      {/* FAB for demo */}
      <div className="fixed bottom-8 right-8">
        <button onClick={() => navigate('/admin?tab=rooms')} className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-105 transition-transform">
          <Wand2 className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default Housekeeping;