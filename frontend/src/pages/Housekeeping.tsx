import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wand2, BedDouble, AlertCircle, Loader, CheckCircle, MessageSquare } from 'lucide-react';
import { RoomStatus, Room } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ResolveMaintenanceModal from '../components/ResolveMaintenanceModal';
import RoomSetupWizard from '../components/RoomSetupWizard';
import ReportIssueModal from '../components/ReportIssueModal';
import RoomDetailsModal from '../components/RoomDetailsModal';
import MessagingModal from '../components/MessagingModal';

const Housekeeping: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [resolveModalRoomId, setResolveModalRoomId] = useState<string | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [roomForDetails, setRoomForDetails] = useState<Room | null>(null);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);

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

    if (!user?.propertyId) return;

    // Subscribe to realtime room updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `property_id=eq.${user.propertyId}`,
        },
        (payload) => {
          setRooms((currentRooms) =>
            currentRooms.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, user?.propertyId]);

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

  // Fetch active maintenance tickets
  const [activeTickets, setActiveTickets] = useState<any[]>([]);

  useEffect(() => {
    if (user?.propertyId) {
      fetchTickets();

      // Subscribe to ticket changes
      const ticketChannel = supabase
        .channel('active-tickets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance', filter: `property_id=eq.${user.propertyId}` },
          () => fetchTickets()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ticketChannel);
      };
    }
  }, [user?.propertyId]);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('maintenance')
      .select('*')
      .eq('property_id', user?.propertyId)
      .neq('status', 'Resolved');

    setActiveTickets(data || []);
  };

  const getActiveTicketForRoom = (roomId: string) => {
    return activeTickets.find(t => t.room_id === roomId);
  };

  const addIssue = (roomId: string, issue: any) => {
    setActiveTickets(prev => [...prev, {
      ...issue,
      room_id: roomId,
      status: 'Open',
      created_at: new Date().toISOString()
    }]);

    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return { ...r, status: RoomStatus.OOO };
      }
      return r;
    }));
  };

  const handleSubmitIssue = async (issueData: any) => {
    if (!selectedRoom || !user?.propertyId) return;

    try {
      // 1. Create Maintenance Ticket
      const { error: ticketError } = await supabase
        .from('maintenance')
        .insert({
          property_id: user.propertyId,
          room_id: selectedRoom.id,
          status: 'Open',
          description: issueData.description,
          priority: issueData.severity,
          category: issueData.category,
          ai_summary: issueData.ai_summary,
          suggested_action: issueData.suggested_action
        });

      if (ticketError) throw ticketError;

      // 2. Set Room to OOO
      // Note: We do this locally via addIssue for optimistic update, 
      // but we also need to persist it to DB. 
      // The local state update happens in addIssue, but let's ensure DB update is called too.
      await handleUpdateStatus(selectedRoom.id, RoomStatus.OOO);

      // Optimistic update
      addIssue(selectedRoom.id, issueData);

      setSelectedRoom(null);
      // fetchTickets(); // No longer needed due to optimistic update
      alert('Issue reported and room marked for maintenance.');
    } catch (error) {
      console.error('Error submitting issue:', error);
      alert('Failed to report issue.');
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
          <p className="text-slate-500 mt-1">Manage room status, cleaning, and maintenance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMessagingModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors shadow-sm">
            <MessageSquare className="w-4 h-4" />
            Broadcast Message
          </button>
          <button onClick={() => setShowWizard(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-purple-200">
            <Wand2 className="w-4 h-4" />
            Setup Wizard
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.value
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map(room => {
          const activeTicket = getActiveTicketForRoom(room.id);
          return (
            <div
              key={room.id}
              onClick={() => {
                setRoomForDetails(room);
                setShowRoomDetails(true);
              }}
              className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col cursor-pointer"
            >
              <div className="p-5 flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Room {room.number}</h3>
                  <p className="text-slate-500 text-sm">{room.type}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1 ${getStatusColor(room.status)}`}>
                  {room.status === RoomStatus.CLEAN ? <CheckCircle size={12} /> :
                    room.status === RoomStatus.DIRTY ? <Loader size={12} className="animate-spin" /> :
                      room.status === RoomStatus.OOO ? <AlertCircle size={12} /> : null}
                  {getStatusDisplay(room.status)}
                </span>
              </div>

              <div className="px-5 py-2 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Floor:</span>
                  <span className="font-medium text-slate-900">{room.floor || 1}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Capacity:</span>
                  <span className="font-medium text-slate-900">{room.capacity || 2} Guests</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rate:</span>
                  <span className="font-medium text-slate-900">${room.price_per_night || 0}/night</span>
                </div>
              </div>

              <div className="p-5 mt-auto space-y-3">
                {room.status === RoomStatus.DIRTY ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(room.id, RoomStatus.CLEAN); }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
                  >
                    Mark Ready
                  </button>
                ) : room.status === RoomStatus.CLEAN ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(room.id, RoomStatus.DIRTY); }}
                      className="py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-medium rounded-lg transition-colors text-sm"
                    >
                      Mark Dirty
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(room.id, RoomStatus.OOO); }}
                      className="py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                    >
                      Maintain
                    </button>
                  </div>
                ) : room.status === RoomStatus.OOO ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setResolveModalRoomId(room.id); }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
                  >
                    Mark Fixed (Ready)
                  </button>
                ) : (
                  <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 font-medium rounded-lg text-sm cursor-not-allowed">
                    Occupied
                  </button>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); }}
                  className={`w-full py-2 text-xs font-medium border rounded-lg transition-all ${room.status === RoomStatus.OOO && activeTicket
                    ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                    : 'bg-transparent text-slate-500 hover:text-slate-700 border-transparent hover:border-slate-200'
                    }`}
                >
                  {room.status === RoomStatus.OOO && activeTicket ? 'View Issue Details' : 'Report Issue'}
                </button>
              </div>
            </div>
          );
        })}
        {filteredRooms.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No rooms found matching this filter.</p>
          </div>
        )}
      </div>

      {/* FAB for demo */}
      <div className="fixed bottom-8 right-8">
        <button onClick={() => setShowWizard(true)} className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-105 transition-transform">
          <Wand2 className="w-6 h-6" />
        </button>
      </div>

      {
        showWizard && (
          <RoomSetupWizard
            onClose={() => setShowWizard(false)}
            onComplete={() => {
              setShowWizard(false);
              fetchRooms(); // Refresh the list
            }}
          />
        )
      }

      {selectedRoom && (
        <ReportIssueModal
          roomNumber={selectedRoom.number}
          existingIssue={getActiveTicketForRoom(selectedRoom.id)}
          onClose={() => setSelectedRoom(null)}
          onSubmit={handleSubmitIssue}
        />
      )}
      {!!resolveModalRoomId && (
        <ResolveMaintenanceModal
          isOpen={!!resolveModalRoomId}
          onClose={() => setResolveModalRoomId(null)}
          ticketId={getActiveTicketForRoom(resolveModalRoomId)?.id}
          roomId={resolveModalRoomId}
          onSuccess={() => {
            setResolveModalRoomId(null);
            handleUpdateStatus(resolveModalRoomId!, RoomStatus.CLEAN);
          }}
        />
      )}

      {/* Room Details Modal */}
      {roomForDetails && (
        <RoomDetailsModal
          isOpen={showRoomDetails}
          onClose={() => {
            setShowRoomDetails(false);
            setRoomForDetails(null);
          }}
          room={roomForDetails}
        />
      )}

      {/* Broadcast Messaging Modal */}
      <MessagingModal
        isOpen={isMessagingModalOpen}
        onClose={() => setIsMessagingModalOpen(false)}
        presetRecipients={[]} // Empty implies broadcast
      />
    </div>
  );
};

export default Housekeeping;