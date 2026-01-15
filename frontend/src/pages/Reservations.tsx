import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../components/UIComponents';
import { Plus, Search, Filter, Calendar as CalendarIcon, MoreVertical, Loader } from 'lucide-react';
import { ReservationStatus, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Reservations: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          guests:guest_id (first_name, last_name),
          rooms:room_id (number)
        `);

      if (user?.propertyId) {
        query = query.eq('property_id', user.propertyId);
      } else if (user?.email !== 'jason@staysync.com') {
        // If no property assigned and not super admin, show nothing (or handle appropriate error)
        setReservations([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Map Supabase result to Reservation interface
        const mappedReservations: Reservation[] = data.map((folder: any) => ({
          id: folder.id,
          guestId: folder.guest_id,
          roomId: folder.room_id,
          checkIn: folder.check_in,
          checkOut: folder.check_out,
          status: folder.status as ReservationStatus,
          totalAmount: 0, // Placeholder as schema might not have this yet
          guestName: folder.guests ? `${folder.guests.first_name} ${folder.guests.last_name}` : 'Unknown Guest',
          roomNumber: folder.rooms ? folder.rooms.number : 'N/A'
        }));
        setReservations(mappedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter(r =>
    r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.roomNumber.includes(searchTerm)
  );

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.CONFIRMED: return 'blue';
      case ReservationStatus.CHECKED_IN: return 'green';
      case ReservationStatus.CHECKED_OUT: return 'gray';
      case ReservationStatus.CANCELLED: return 'red';
      default: return 'yellow';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-gold-500" /></div>;
  }

  if (!user?.propertyId && user?.email !== 'jason@staysync.com') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p>You are not assigned to any property.</p>
        <p className="text-sm">Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Calendar
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search guest or room..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button icon={Plus}>New Booking</Button>
        </div>
      </div>

      {view === 'list' ? (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Guest</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Room</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Check In</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Check Out</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{res.guestName}</div>
                      <div className="text-xs text-slate-500">ID: {res.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">#{res.roomNumber}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(res.checkIn).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(res.checkOut).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Badge color={getStatusColor(res.status)}>{res.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">${res.totalAmount}</td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredReservations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No reservations found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="h-[600px] flex items-center justify-center text-slate-400 bg-slate-50 border-dashed">
          <div className="text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-slate-900">Calendar View</h3>
            <p>Visual timeline implementation would go here.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reservations;