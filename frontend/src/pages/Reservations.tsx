import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../components/UIComponents';
import { Plus, Search, Filter, Calendar as CalendarIcon, MoreVertical, Loader } from 'lucide-react';
import { ReservationStatus, Reservation } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Reservations: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'calendar' | 'rates'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Rates & Revenue State
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Timeline State
  const [rooms, setRooms] = useState<any[]>([]);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    guestId: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    guestName: '', // For now simple text or we can implement search later
    notes: ''
  });

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
          totalAmount: folder.total_amount || 0, // Placeholder as schema might not have this yet
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

  const fetchRooms = async () => {
    if (!user?.propertyId) return;
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', user.propertyId)
        .order('number');

      if (data) setRooms(data);
    } catch (e) {
      console.error('Error fetching rooms', e);
    }
  };

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  // Quote State
  const [quote, setQuote] = useState<{ total: number, nights: number, breakdown: { date: string, price: number }[] } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Calculate quote when form changes
  useEffect(() => {
    const calculateQuote = async () => {
      const { roomId, checkIn, checkOut } = bookingForm;
      if (!roomId || !checkIn || !checkOut) {
        setQuote(null);
        return;
      }

      const start = new Date(checkIn);
      const end = new Date(checkOut);

      if (start >= end) {
        setQuote(null);
        return;
      }

      setQuoteLoading(true);
      try {
        // 1. Get Room Type
        const room = rooms.find(r => r.id === roomId);
        if (!room) throw new Error("Room not found");

        // 2. Fetch Rates
        const { data: ratesData } = await supabase
          .from('room_rates')
          .select('*')
          .eq('property_id', user?.propertyId)
          .eq('room_type', room.type)
          .gte('date', checkIn)
          .lt('date', checkOut);

        // 3. detailed breakdown
        let total = 0;
        const breakdown = [];
        let nights = 0;

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const rateObj = ratesData?.find(r => r.date === dateStr);
          const price = rateObj ? Number(rateObj.price) : (Number(room.price_per_night) || 100); // Fallback to room default or 100

          breakdown.push({ date: dateStr, price });
          total += price;
          nights++;
        }

        setQuote({ total, nights, breakdown });

      } catch (e) {
        console.error(e);
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(calculateQuote, 500); // Debounce
    return () => clearTimeout(debounce);

  }, [bookingForm.roomId, bookingForm.checkIn, bookingForm.checkOut, rooms, user?.propertyId]);

  const handleCreateBooking = async () => {
    if (!user?.propertyId || !bookingForm.guestName || !bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut) {
      alert("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      // 1. Create Guest if not checking existing (keeping simple for now: always create new or we need a guest picker)
      // For MVP: Create guest implicitly or just use form name
      let guest_id = bookingForm.guestId;

      if (!guest_id) {
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            property_id: user.propertyId,
            first_name: bookingForm.guestName.split(' ')[0],
            last_name: bookingForm.guestName.split(' ').slice(1).join(' ') || '.',
            email: 'placeholder@email.com', // Placeholder
            phone: ''
          })
          .select()
          .single();

        if (guestError) throw guestError;
        guest_id = newGuest.id;
      }

      // 2. Create Reservation
      const { error: resError } = await supabase
        .from('reservations')
        .insert({
          property_id: user.propertyId,
          guest_id: guest_id,
          room_id: bookingForm.roomId,
          check_in: bookingForm.checkIn,
          check_out: bookingForm.checkOut,
          status: 'Confirmed',
          total_amount: quote ? quote.total : await calculateTotalAmount(bookingForm.roomId, bookingForm.checkIn, bookingForm.checkOut)
        });

      if (resError) throw resError;

      setIsBookingModalOpen(false);
      fetchReservations();
      // Reset form
      setBookingForm({ guestId: '', roomId: '', checkIn: '', checkOut: '', guestName: '', notes: '' });

    } catch (err: any) {
      console.error("Booking Error:", err);
      alert("Failed to create booking: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = async (roomId: string, checkIn: string, checkOut: string) => {
    // 1. Get Room Type
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 0;

    // 2. Fetch Rates for Date Range
    const { data: ratesData } = await supabase
      .from('room_rates')
      .select('*')
      .eq('property_id', user?.propertyId)
      .eq('room_type', room.type)
      .gte('date', checkIn)
      .lt('date', checkOut); // Check-out day is not charged

    // 3. Calculate Daily Sum
    let total = 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const rate = ratesData?.find(r => r.date === dateStr);
      // Fallback to base rate (assuming 100 if unknown for now, ideally room.price)
      // We should add price to room table, but for now let's use a safe default or 0
      total += rate ? Number(rate.price) : 100;
    }
    return total;
  };

  const calculateRevenueStats = () => {
    if (rooms.length === 0) return { adr: 0, occupancy: 0, revpar: 0 };

    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const totalRoomNightsAvailable = rooms.length * daysInMonth;

    let totalRevenue = 0;
    let totalBookedNights = 0;

    // Simple estimation based on reservations in this month
    // Note: This is a frontend-side approximation. For production, use a dedicated backend query.
    reservations.forEach(res => {
      // Check overlap with current month
      const checkIn = new Date(res.checkIn);
      const checkOut = new Date(res.checkOut);

      // If completely outside, skip
      if (checkOut <= startOfMonth || checkIn > endOfMonth) return;

      // Calculate overlapping nights
      const overlapStart = checkIn < startOfMonth ? startOfMonth : checkIn;
      const overlapEnd = checkOut > endOfMonth ? endOfMonth : checkOut; // logic slightly off for check-out day, usually check-out day is not "stayed"

      // Fix: check-out day exclusion
      const effectiveEnd = checkOut > endOfMonth ? endOfMonth : new Date(checkOut.getTime() - 86400000);
      if (effectiveEnd < overlapStart) return;

      const nights = Math.ceil((Math.min(checkOut.getTime(), endOfMonth.getTime() + 86400000) - Math.max(checkIn.getTime(), startOfMonth.getTime())) / (1000 * 60 * 60 * 24));
      // Ensure positive
      const validNights = Math.max(0, nights);

      // Revenue allocation (pro-rated) - VERY simplified
      // Assuming linear distribution of totalAmount
      const totalStayNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const dailyRate = res.totalAmount / (totalStayNights || 1);

      totalBookedNights += validNights;
      totalRevenue += (dailyRate * validNights);
    });

    const adr = totalBookedNights > 0 ? totalRevenue / totalBookedNights : 0;
    const occupancy = (totalBookedNights / totalRoomNightsAvailable) * 100;
    const revpar = totalRevenue / totalRoomNightsAvailable;

    return { adr, occupancy, revpar };
  };

  const fetchRates = async () => {
    if (!user?.propertyId) return;

    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    try {
      // Get unique room types from rooms table
      const { data: rooms } = await supabase
        .from('rooms')
        .select('type')
        .eq('property_id', user.propertyId);

      if (rooms) {
        const types = Array.from(new Set(rooms.map(r => r.type)));
        setRoomTypes(types);
      }

      // Get rates for this month
      const { data: ratesData } = await supabase
        .from('room_rates')
        .select('*')
        .eq('property_id', user.propertyId)
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString());

      setRates(ratesData || []);
    } catch (err) {
      console.error('Error fetching rates:', err);
    }
  };

  const handleRateChange = async (roomType: string, date: Date, price: string) => {
    if (!user?.propertyId) return;
    const dateStr = date.toISOString().split('T')[0];
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return;

    try {
      // Check if rate exists
      const existing = rates.find(r => r.room_type === roomType && r.date === dateStr);

      if (existing) {
        await supabase
          .from('room_rates')
          .update({ price: numericPrice })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('room_rates')
          .insert({
            property_id: user.propertyId,
            room_type: roomType,
            date: dateStr,
            price: numericPrice
          });
      }
      await fetchRates(); // Refresh
    } catch (err) {
      console.error('Error saving rate:', err);
    }
  };

  useEffect(() => {
    if (view === 'rates') fetchRates();
  }, [view, selectedMonth, user?.propertyId]);

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
            <button
              onClick={() => setView('rates')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'rates' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Rates & Revenue
            </button>
          </div>
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
          <Button icon={Plus} onClick={() => setIsBookingModalOpen(true)}>New Booking</Button>
        </div>
      </div>

      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">New Reservation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Guest Name</label>
                <Input
                  value={bookingForm.guestName}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Room</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={bookingForm.roomId}
                  onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                >
                  <option value="">Select Room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.number} - {room.type}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Check In</label>
                  <Input type="date" value={bookingForm.checkIn} onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Check Out</label>
                  <Input type="date" value={bookingForm.checkOut} onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Auto-Calculating Quote Table */}
            {(bookingForm.roomId && bookingForm.checkIn && bookingForm.checkOut) && (
              <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Price Breakdown</h4>
                {quoteLoading ? (
                  <div className="text-center py-2 text-slate-500 text-sm">Calculating...</div>
                ) : quote ? (
                  <div className="text-sm">
                    <div className="max-h-32 overflow-y-auto border-b border-slate-200 mb-2">
                      <table className="w-full text-left">
                        <thead className="text-xs text-slate-500 sticky top-0 bg-slate-50">
                          <tr>
                            <th className="pb-1">Date</th>
                            <th className="pb-1 text-right">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600">
                          {quote.breakdown.map((day: any, index: number) => (
                            <tr key={day.date}>
                              <td className="py-1">{new Date(day.date).toLocaleDateString()}</td>
                              <td className="py-1 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-24 text-right p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                                  value={day.price}
                                  onChange={(e) => {
                                    const newPrice = parseFloat(e.target.value) || 0;
                                    const newBreakdown = [...quote.breakdown];
                                    newBreakdown[index].price = newPrice;
                                    const newTotal = newBreakdown.reduce((sum, d) => sum + d.price, 0);
                                    setQuote({ ...quote, breakdown: newBreakdown, total: newTotal });
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-900 pt-1">
                      <span>Total ({quote.nights} nights)</span>
                      <span>${quote.total.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-slate-400 text-xs">Invalid dates</div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setIsBookingModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateBooking}>Confirm Booking</Button>
            </div>
          </div>
        </div>
      )}

      {
        view === 'list' ? (
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
        ) : view === 'calendar' ? (
          <Card className="overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Timeline & Availability</h2>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}>Prev</Button>
                <span className="font-bold flex items-center px-4">{selectedMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                <Button variant="ghost" onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}>Next</Button>
              </div>
            </div>
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[100px_1fr] border-b">
                <div className="p-2 font-bold bg-slate-50 border-r">Room</div>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()}, minmax(40px, 1fr))` }}>
                  {Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                    <div key={day} className="text-center text-xs p-1 border-l text-slate-500">
                      {day}
                      <div className="font-mono">{new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day).toLocaleDateString(undefined, { weekday: 'narrow' })}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* We need distinct rooms, not filtering by room types only. Fetching rooms is needed or we can map from available reservations if full list not available, but ideally we show all rooms.
                For now, let's assume we can derive rooms from reservations or roomTypes derived earlier. But roomTypes are just types.
                We should validly fetch rooms. I'll add rooms fetching to the effect.
            */}
              <div className="divide-y relative">
                {rooms.map(room => (
                  <div key={room.id} className="grid grid-cols-[100px_1fr] hover:bg-slate-50 relative group">
                    <div className="p-3 font-medium bg-white border-r text-sm truncate sticky left-0 z-10 flex flex-col justify-center">
                      <span>Room {room.number}</span>
                      <span className="text-xs text-slate-400">{room.type}</span>
                    </div>
                    <div className="grid relative" style={{ gridTemplateColumns: `repeat(${new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()}, 1fr)` }}>
                      {/* Grid Lines */}
                      {Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                        <div key={day} className="border-l h-12"></div>
                      ))}

                      {/* Reservations Bars */}
                      {reservations
                        .filter(res => res.roomId === room.id)
                        .map(res => {
                          const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
                          const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
                          const checkIn = new Date(res.checkIn);
                          const checkOut = new Date(res.checkOut);

                          // Check overlap
                          if (checkOut <= startOfMonth || checkIn > endOfMonth) return null;

                          // Calculate Grid Position
                          // Start Day: Max(1, checkIn date)
                          const startDay = checkIn < startOfMonth ? 1 : checkIn.getDate();

                          // Duration: Min(endOfMonth, checkOut) - Start
                          const endDay = checkOut > endOfMonth ? endOfMonth.getDate() : checkOut.getDate();
                          const span = Math.max(1, endDay - startDay); // at least 1 day block? or checkOut is day AFTER last night? Usually hotel checkOut is day after.
                          // if checkIn 1st, checkOut 2nd -> 1 night. Span should reflect nights? or visual block?
                          // Visual block from CheckIn Day start to CheckOut Day start.

                          return (
                            <div
                              key={res.id}
                              className="absolute top-1 bottom-1 bg-blue-500 rounded text-white text-xs flex items-center px-2 truncate shadow-sm z-0 hover:z-20 hover:shadow-md transition-all cursor-pointer border border-blue-600"
                              style={{
                                gridColumnStart: startDay,
                                gridColumnEnd: `span ${span}`,
                                left: '2px',
                                right: '2px'
                              }}
                              title={`${res.guestName} (${res.status})`}
                            >
                              {res.guestName}
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <>
            {view === 'rates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Revenue Management</h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}>Prev</Button>
                    <span className="font-bold flex items-center px-4">{selectedMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                    <Button variant="ghost" onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}>Next</Button>
                  </div>
                </div>

                {/* Revenue Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-white border-none shadow-sm">
                    <div className="text-sm text-slate-500 font-medium">Occupancy</div>
                    <div className="text-2xl font-bold text-slate-900">{calculateRevenueStats().occupancy.toFixed(1)}%</div>
                    <div className="text-xs text-green-600 mt-1">Target: 75%</div>
                  </Card>
                  <Card className="p-4 bg-white border-none shadow-sm">
                    <div className="text-sm text-slate-500 font-medium">ADR (Average Daily Rate)</div>
                    <div className="text-2xl font-bold text-slate-900">${calculateRevenueStats().adr.toFixed(2)}</div>
                    <div className="text-xs text-slate-400 mt-1">vs Last Month</div>
                  </Card>
                  <Card className="p-4 bg-white border-none shadow-sm">
                    <div className="text-sm text-slate-500 font-medium">RevPAR</div>
                    <div className="text-2xl font-bold text-slate-900">${calculateRevenueStats().revpar.toFixed(2)}</div>
                    <div className="text-xs text-blue-600 mt-1">Revenue Per Available Room</div>
                  </Card>
                </div>

                <Card className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-3 text-left bg-slate-50 sticky left-0 z-10 border-b">Room Type</th>
                        {Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                          <th key={day} className="p-2 min-w-[60px] text-center bg-slate-50 border-b border-l text-xs text-slate-500 font-mono">
                            {day}
                            <br />
                            {new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day).toLocaleDateString(undefined, { weekday: 'narrow' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roomTypes.map(type => (
                        <tr key={type} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white border-r z-10 shadow-sm">{type}</td>
                          {Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                            const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
                            const dateStr = date.toISOString().split('T')[0];
                            const rate = rates.find(r => r.room_type === type && r.date === dateStr);

                            return (
                              <td key={day} className="p-0 border-r border-b relative">
                                <input
                                  type="number"
                                  className="w-full h-full p-2 text-center bg-transparent focus:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-colors"
                                  placeholder="-"
                                  defaultValue={rate?.price}
                                  onBlur={(e) => handleRateChange(type, date, e.target.value)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}
          </>
        )
      }
    </div >
  );
};

export default Reservations;