import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Modal } from '../components/UIComponents';
import { Plus, Search, MoreVertical, Loader, Edit, Trash2, AlertTriangle, BadgeDollarSign } from 'lucide-react';
import { ReservationStatus, Reservation, Room, PropertyTax } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import CheckInModal from '../components/CheckInModal';
import AddChargeModal from '../components/AddChargeModal';
import PaymentModal from '../components/PaymentModal';
import RoomDetailsModal from '../components/RoomDetailsModal';

const Reservations: React.FC = () => {
  const { user, session } = useAuth();
  const [view, setView] = useState<'list' | 'calendar' | 'rates'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Rates & Revenue State
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Timeline State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<PropertyTax[]>([]);
  const [taxEngineEnabled, setTaxEngineEnabled] = useState(false);


  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedResForPayment, setSelectedResForPayment] = useState<Reservation | null>(null);

  // Charge Modal State
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [selectedResForCharge, setSelectedResForCharge] = useState<Reservation | null>(null);

  const [isIndefinite, setIsIndefinite] = useState(false);
  const [startingBalance, setStartingBalance] = useState('');
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [newGuestForm, setNewGuestForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [bookingForm, setBookingForm] = useState({
    guestId: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    guestName: '',
    notes: ''
  });
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOverride, setIsOverride] = useState(false);

  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);

  // Check In Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [reservationToCheckIn, setReservationToCheckIn] = useState<Reservation | null>(null);

  // Room Details Modal State
  const [isRoomDetailsModalOpen, setIsRoomDetailsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Live guest search and conflict warning states
  const [guestSearch, setGuestSearch] = useState('');
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);


  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user, activeTab]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reservations')
        .select(`
  *,
  guests(first_name, last_name),
  rooms(number),
  financial_transactions(amount, type)
    `);

      if (user?.propertyId) {
        query = query.eq('property_id', user.propertyId);
      } else if (user?.email !== 'jason@staysync.com') {
        // If no property assigned and not super admin, show nothing (or handle appropriate error)
        setReservations([]);
        setLoading(false);
        return;
      }
      query = query.order('check_in', { ascending: false });

      // Filter based on Tab
      if (activeTab === 'active') {
        // Active: Confirmed, Checked In
        query = query.in('status', ['Confirmed', 'Checked In', 'Pending']); // Added Pending just in case
      } else {
        // Archived: Checked Out, Cancelled
        // AND check_out >= 3 years ago
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

        query = query.in('status', ['Checked Out', 'Cancelled'])
          .gte('check_out', threeYearsAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Map Supabase result to Reservation interface
        const mappedReservations: Reservation[] = data.map((r: any) => {
          const totalPaid = r.financial_transactions 
            ? r.financial_transactions.filter((t: any) => t.type === 'payment').reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0) 
            : 0;
          const manualCharges = r.financial_transactions
            ? r.financial_transactions.filter((t: any) => t.type === 'charge').reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)
            : 0;
            
          const totalAmount = r.total_amount || 0;
          const roomTotal = Math.max(0, totalAmount - manualCharges);
          
          const checkIn = new Date(r.check_in);
          const checkOut = new Date(r.check_out);
          const today = new Date();
          
          let totalNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
          // If indefinite, treat as 1 night for base division so we just use the daily rate as if it's per night
          if (r.is_indefinite) totalNights = 1;
          
          const nightsStayed = Math.max(0, Math.ceil((Math.min(today.getTime(), checkOut.getTime()) - checkIn.getTime()) / (1000 * 3600 * 24)));
          
          const accruedRoomCharge = (roomTotal / totalNights) * (r.is_indefinite ? nightsStayed : Math.min(nightsStayed, totalNights));
          const accruedAmount = accruedRoomCharge + manualCharges;

          return {
            id: r.id,
            friendlyId: r.friendly_id,
            guestId: r.guest_id || '',
            roomId: r.room_id || '',
            checkIn: r.check_in,
            checkOut: r.check_out,
            status: r.status as ReservationStatus,
            totalAmount: totalAmount,
            accruedAmount: accruedAmount, 
            totalPaid: totalPaid,
            guestName: r.guests ? `${r.guests.first_name} ${r.guests.last_name}` : 'Unknown Guest',
            roomNumber: r.rooms ? r.rooms.number : 'N/A'
          };
        });
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
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', user.propertyId)
        .order('number');

      if (data) setRooms(data);
    } catch (e) {
      console.error('Error fetching rooms', e);
    }
  };

  const fetchGuests = async () => {
    if (!user?.propertyId) return;
    try {
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('property_id', user.propertyId)
        .order('last_name'); // Sort by name

      if (data) setGuests(data);
    } catch (e) {
      console.error('Error fetching guests', e);
    }
  };

  const fetchPropertySettings = async () => {
    if (!user?.propertyId) return;
    try {
        const { data } = await supabase.from('properties').select('enable_tax_engine').eq('id', user.propertyId).single();
        if (data?.enable_tax_engine) {
            setTaxEngineEnabled(true);
            const { data: taxData } = await supabase.from('property_taxes').select('*').eq('property_id', user.propertyId).eq('is_active', true);
            if (taxData) setTaxes(taxData as PropertyTax[]);
        }
    } catch (e) {
        console.error("Error fetching tax settings", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRooms();
      fetchGuests();
      fetchPropertySettings();
    }
  }, [user]);

  // Quote State
  const [quote, setQuote] = useState<{ total: number, nights: number, breakdown: { date: string, price: number }[] } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Calculate quote when form changes
  useEffect(() => {
    const calculateQuote = async () => {
      const { roomId, checkIn, checkOut } = bookingForm;

      if (!roomId || !checkIn) {
        setQuote(null);
        return;
      }

      if (!isIndefinite && !checkOut) {
        setQuote(null);
        return;
      }

      // For Indefinite, we calculate quote for 1 night (or 30 days projection?)
      // User says "projected revenue" is needed or strict accrual? 
      // "without a projected revenue but still accrued balance"
      // So quote should probably show "Daily Rate"

      const start = new Date(checkIn);
      // Indefinite Logic:
      // If start is in the past, end is NOW (accrued).
      // If start is in future, maybe show 1 night rate as estimate?
      // User request: "calculate money owed up until the current date"
      let end: Date;

      if (isIndefinite) {
        const now = new Date();
        if (start < now) {
          end = now; // Accrued until today
        } else {
          end = new Date(start.getTime() + 86400000); // 1 Night Estimate
        }
      } else {
        end = new Date(checkOut);
      }

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
        let baseTotal = 0;
        const breakdown = [];
        let nights = 0;

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const rateObj = ratesData?.find(r => r.date === dateStr);
          const price = rateObj ? Number(rateObj.price) : (Number(room.price_per_night) || 100);

          breakdown.push({ date: dateStr, price });
          baseTotal += price;
          nights++;
        }

        let taxTotal = 0;
        if (taxEngineEnabled && taxes.length > 0) {
            taxes.forEach(tax => {
                const amt = Number(tax.amount);
                if (tax.type === 'PERCENTAGE') taxTotal += (baseTotal * (amt / 100));
                else if (tax.type === 'FLAT_PER_NIGHT') taxTotal += (amt * nights);
                else if (tax.type === 'FLAT_PER_STAY') taxTotal += amt;
                else if (tax.type === 'PER_GUEST_PER_NIGHT') taxTotal += (amt * nights);
            });
        }
        
        const total = baseTotal + taxTotal;

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

  // Live conflict warning check
  useEffect(() => {
    if (!bookingForm.roomId || !bookingForm.checkIn || (!bookingForm.checkOut && !isIndefinite)) {
      setConflictWarning(null);
      return;
    }

    const start = new Date(bookingForm.checkIn);
    const end = isIndefinite ? new Date('2099-12-31') : new Date(bookingForm.checkOut);

    const conflict = reservations.find(res => {
      if (res.roomId !== bookingForm.roomId) return false;
      if (res.id === editingReservationId) return false;
      if (res.status === 'Cancelled' || res.status === 'Checked Out') return false;

      const resStart = new Date(res.checkIn);
      const resEnd = new Date(res.checkOut);

      return start < resEnd && end > resStart;
    });

    if (conflict) {
      setConflictWarning(`⚠️ Room is already occupied by ${conflict.guestName} from ${new Date(conflict.checkIn).toLocaleDateString()} to ${new Date(conflict.checkOut).toLocaleDateString()}!`);
    } else {
      setConflictWarning(null);
    }
  }, [bookingForm.roomId, bookingForm.checkIn, bookingForm.checkOut, isIndefinite, editingReservationId, reservations]);

  const handleCreateBooking = async () => {
    if (!user?.propertyId || !bookingForm.roomId || !bookingForm.checkIn || (!isIndefinite && !bookingForm.checkOut)) {
      alert("Please fill all required fields");
      return;
    }

    if (isNewGuest && (!newGuestForm.firstName || !newGuestForm.lastName)) {
      alert("Please enter guest name");
      return;
    }

    if (!isNewGuest && !bookingForm.guestId) {
      alert("Please select a guest");
      return;
    }

    // 28-Day Limit Validation
    if (!isIndefinite && bookingForm.checkIn && bookingForm.checkOut) {
      const start = new Date(bookingForm.checkIn);
      const end = new Date(bookingForm.checkOut);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 28 && !isOverride) {
        alert("Policy Alert: Maximum stay is 28 days. You must enable the 'Override' option to proceed with this long-term booking.");
        return;
      }
    }

    if (isIndefinite && !isOverride) {
      // Optional: Warn for indefinite too? Assuming indefinite is always potentially > 28 days.
      // Let's enforce override for indefinite as well to be safe, or just alerting user.
      // For now, let's keep it simple: Indefinite usually means long term.
      const confirmIndefinite = window.confirm("Indefinite stays may exceed the 28-day limit. Proceed?");
      if (!confirmIndefinite) return;
    }

    setLoading(true);
    try {
      // 0. Double Booking Prevention
      // Check for any reservation that overlaps with the requested dates for this room
      // that is NOT Cancelled or Checked Out.
      const effectiveCheckOut = isIndefinite ? '2099-12-31' : bookingForm.checkOut; // Use far future for collision check in DB, but display/financials handled differently

      const { data: overlap, error: overlapError } = await supabase
        .from('reservations')
        .select('id')
        .eq('room_id', bookingForm.roomId)
        .neq('status', 'Cancelled')
        .neq('status', 'Checked Out')
        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        // creating_check_in <= existing_check_out AND creating_check_out >= existing_check_in
        .or(`and(check_in.lte.${effectiveCheckOut}, check_out.gte.${bookingForm.checkIn})`)
        .limit(1);

      if (overlapError) throw overlapError;

      // If we are editing, we must exclude our own ID from the check
      const isSelfOverlap = overlap && overlap.length > 0 && editingReservationId && overlap[0].id === editingReservationId;

      if (overlap && overlap.length > 0 && !isSelfOverlap) {
        alert("This room is already booked for the selected dates!");
        setLoading(false);
        return;
      }

      let guest_id = bookingForm.guestId;

      // 1. Create Guest if New
      if (isNewGuest) {
        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert({
            property_id: user.propertyId,
            first_name: newGuestForm.firstName,
            last_name: newGuestForm.lastName,
            email: newGuestForm.email || `guest_${Date.now()} @placeholder.com`,
            phone: newGuestForm.phone
          })
          .select()
          .single();

        if (guestError) throw guestError;
        guest_id = newGuest.id;
      }


      // 2. Create or Update Reservation
      if (editingReservationId) {
        // UPDATE Existing
        const response = await fetch(`/api/reservations/${editingReservationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token} `
          },
          body: JSON.stringify({
            property_id: user.propertyId,
            guest_id: guest_id,
            room_id: bookingForm.roomId,
            check_in: bookingForm.checkIn,
            check_out: isIndefinite ? '2099-12-31' : bookingForm.checkOut,
            // status: 'Confirmed', removed duplicate

            status: reservations.find(r => r.id === editingReservationId)?.status || 'Confirmed',
            total_price: quote ? quote.total : await calculateTotalAmount(bookingForm.roomId, bookingForm.checkIn, bookingForm.checkOut),
            modified_by: user.id,
            modifier_name: user.email // Fallback to email as name is not in User context yet
          })
        });

        if (!response.ok) throw new Error('Failed to update reservation');
      } else {
        // CREATE New
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token} `
          },
          body: JSON.stringify({
            property_id: user.propertyId,
            guest_id: guest_id,
            room_id: bookingForm.roomId,
            check_in: bookingForm.checkIn,
            check_out: isIndefinite ? '2099-12-31' : bookingForm.checkOut,
            is_indefinite: isIndefinite,
            status: 'Confirmed',
            total_price: quote ? quote.total : await calculateTotalAmount(bookingForm.roomId, bookingForm.checkIn, bookingForm.checkOut),
            starting_balance: Number(startingBalance) || 0
          })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to create reservation: ${text} `);
        }
      }

      setIsBookingModalOpen(false);
      fetchReservations();
      fetchGuests(); // Refresh guest list if we added one
      // Reset form
      setBookingForm({ guestId: '', roomId: '', checkIn: '', checkOut: '', guestName: '', notes: '' });
      setNewGuestForm({ firstName: '', lastName: '', email: '', phone: '' });
      setIsNewGuest(false);
      setStartingBalance('');
      setEditingReservationId(null);

    } catch (err: any) {
      console.error("Booking Error:", err);
      alert("Failed to create booking: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Assuming a Reservation interface exists elsewhere, it would look something like this:
  // interface Reservation {
  //   id: string;
  //   propertyId: string;
  //   guestId: string;
  //   roomId: string;
  //   checkIn: string;
  //   checkOut: string;
  //   status: string;
  //   totalAmount: number;
  //   totalPaid?: number; // Added as per instruction
  //   guestName: string;
  //   roomNumber: string;
  //   // ... other properties
  // }

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
    let baseTotal = 0;
    let nights = 0;
    const start = new Date(checkIn);
    let end = new Date(checkOut);

    // Indefinite Logic: If checkout is far future (e.g. 2099), clamp to NOW or 1 night
    if (end.getFullYear() > 2050) {
      const now = new Date();
      if (start < now) {
        end = now; 
      } else {
        end = new Date(start.getTime() + 86400000); 
      }
    }

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const rate = ratesData?.find(r => r.date === dateStr);
      baseTotal += rate ? Number(rate.price) : (Number(room.price_per_night) || 100);
      nights++;
    }

    let taxTotal = 0;
    if (taxEngineEnabled && taxes.length > 0) {
        taxes.forEach(tax => {
            const amt = Number(tax.amount);
            if (tax.type === 'PERCENTAGE') taxTotal += (baseTotal * (amt / 100));
            else if (tax.type === 'FLAT_PER_NIGHT') taxTotal += (amt * nights);
            else if (tax.type === 'FLAT_PER_STAY') taxTotal += amt;
            else if (tax.type === 'PER_GUEST_PER_NIGHT') taxTotal += (amt * nights);
        });
    }

    return baseTotal + taxTotal;
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
      // logic formerly calculated overlapEnd here, but it was unused.

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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    let confirmMsg = `Are you sure you want to mark this reservation as ${newStatus}?`;

    if (newStatus === 'Checked Out') {
      const now = new Date();
      if (now.getHours() >= 12) {
        confirmMsg = `LATE CHECKOUT WARNING: \nIt is past 12:00 PM.A $10.00 Late Checkout Fee will be automatically applied to this reservation.\n\nProceed with Checkout ? `;
      }
    }

    if (!confirm(confirmMsg)) return;

    try {
      // We need the full reservation object to update it, as our API (currently) expects a full PUT body usually,
      // but let's see check the controller. The controller expects:
      // { property_id, guest_id, room_id, check_in, check_out, status, total_price }
      // So we first need to find the reservation in our local state.
      const res = reservations.find(r => r.id === id);
      if (!res) return;

      // We rely on the backend API to handle the update and all related side-effects (Room Status, Financials).

      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token} `
        },
        body: JSON.stringify({
          property_id: user?.propertyId,
          guest_id: res.guestId,
          room_id: res.roomId,
          check_in: res.checkIn,
          check_out: newStatus === 'Checked Out' ? new Date().toISOString().split('T')[0] : res.checkOut,
          status: newStatus,
          total_price: res.totalAmount,
          modified_by: user?.id,
          modifier_name: user?.email
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[DEBUG] Update Failed: Status ${response.status} ${response.statusText}.Body: `, text);
        let errMsg = `Failed to update(${response.status} ${response.statusText})`;
        try {
          if (text) {
            const err = JSON.parse(text);
            errMsg = err.message || errMsg;
          } else {
            errMsg += ': Empty response body';
          }
        } catch (e) {
          console.error("Failed to parse error response:", text);
          errMsg += `: ${text ? text.substring(0, 100) : 'Empty Body'} `;
        }
        throw new Error(errMsg);
      }

      // Update local state immediately for UI responsiveness, then fetch strict data
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as ReservationStatus } : r));

      fetchReservations();
      if (user) fetchRooms();

      // If Checking Out, Generate Invoice
      if (newStatus === 'Checked Out') {
        const fullGuest = guests.find(g => g.id === res.guestId) || { id: res.guestId, fullName: res.guestName, email: '', phone: '', propertyId: user?.propertyId || '', vipStatus: false, notes: '' };

        try {
          const pdfBlob = generateInvoicePDF(res, fullGuest, user?.propertyName, user?.email || 'System');
          const fileName = `Invoice_${res.id}.pdf`;
          const filePath = `${res.guestId}/${fileName}`;

          // Upload
          const { error: uploadError } = await supabase.storage
            .from('guest_documents')
            .upload(filePath, pdfBlob, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (uploadError) {
            console.error("Failed to upload invoice:", uploadError);
          } else {
            console.log("Invoice uploaded successfully");
          }

        } catch (pdfErr) {
          console.error("Failed to generate PDF:", pdfErr);
        }
      }

    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDeleteClick = (id: string) => {
    setReservationToDelete(id);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const confirmDeleteReservation = async () => {
    if (!reservationToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/reservations/${reservationToDelete}?modified_by=${user?.id}&modifier_name=${user?.email}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete');

      fetchReservations();
      setIsDeleteModalOpen(false);
      setReservationToDelete(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      alert("Failed to delete: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewBookingClick = () => {
    setEditingReservationId(null);
    setBookingForm({ guestId: '', roomId: '', checkIn: '', checkOut: '', guestName: '', notes: '' });
    setNewGuestForm({ firstName: '', lastName: '', email: '', phone: '' });
    setGuestSearch('');
    setIsNewGuest(false);
    setStartingBalance('');
    setIsIndefinite(false);
    setIsBookingModalOpen(true);
  };

  const handleEditClick = (res: Reservation) => {
    setEditingReservationId(res.id);
    setBookingForm({
      guestId: res.guestId,
      roomId: res.roomId,
      checkIn: res.checkIn,
      checkOut: res.checkOut,
      guestName: res.guestName,
      notes: ''
    });
    setGuestSearch(res.guestName || '');
    setIsNewGuest(false);
    // Determine if indefinite
    // Simple check: is checkOut far in future? Or logic from DB? 
    // Ideally we pass is_indefinite from DB.
    // For now, just set dates.
    setIsIndefinite(false);
    setStartingBalance('');
    setIsBookingModalOpen(true);
    setOpenMenuId(null);
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomDetailsModalOpen(true);
  };


  const filteredGuestsForSearch = guests.filter(g =>
    `${g.first_name || ''} ${g.last_name || ''}`.toLowerCase().includes(guestSearch.toLowerCase()) ||
    (g.email && g.email.toLowerCase().includes(guestSearch.toLowerCase()))
  );

  const filteredReservations = reservations.filter(r =>
    r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.roomNumber.includes(searchTerm) ||
    (r.friendlyId && r.friendlyId.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <div className="flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'active'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'archived'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              Archived
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 w-fit">
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
              placeholder={`Search ${activeTab === 'archived' ? 'archived ' : ''}reservations...`}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'active' && (
            <Button icon={Plus} onClick={handleNewBookingClick}>New Booking</Button>
          )}
        </div>
      </div>

      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingReservationId ? 'Edit Reservation' : 'New Reservation'}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Guest</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewGuest(!isNewGuest);
                      setGuestSearch('');
                      setBookingForm({ ...bookingForm, guestId: '', guestName: '' });
                    }}
                    className="text-xs text-gold-600 hover:text-gold-700 font-medium hover:underline focus:outline-none"
                  >
                    {isNewGuest ? 'Select Existing Guest' : 'Register New Guest'}
                  </button>
                </div>

                {isNewGuest ? (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={newGuestForm.firstName}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, firstName: e.target.value })}
                        placeholder="First Name"
                      />
                      <Input
                        value={newGuestForm.lastName}
                        onChange={(e) => setNewGuestForm({ ...newGuestForm, lastName: e.target.value })}
                        placeholder="Last Name"
                      />
                    </div>
                    <Input
                      type="email"
                      value={newGuestForm.email}
                      onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })}
                      placeholder="Email (Optional)"
                    />
                    <Input
                      type="tel"
                      value={newGuestForm.phone}
                      onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })}
                      placeholder="Phone (Optional)"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none bg-white text-sm"
                      placeholder="Type guest name or email..."
                      value={guestSearch}
                      onChange={(e) => {
                        setGuestSearch(e.target.value);
                        setShowGuestDropdown(true);
                        if (bookingForm.guestId) {
                          setBookingForm({ ...bookingForm, guestId: '', guestName: '' });
                        }
                      }}
                      onFocus={() => setShowGuestDropdown(true)}
                    />
                    
                    {showGuestDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowGuestDropdown(false)} />
                        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                          {filteredGuestsForSearch.length > 0 ? (
                            filteredGuestsForSearch.map(g => (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setBookingForm({
                                    ...bookingForm,
                                    guestId: g.id,
                                    guestName: `${g.first_name} ${g.last_name}`
                                  });
                                  setGuestSearch(`${g.first_name} ${g.last_name}`);
                                  setShowGuestDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex flex-col"
                              >
                                <span className="font-semibold text-slate-800">{g.first_name} {g.last_name}</span>
                                {g.email && <span className="text-xs text-slate-500">{g.email}</span>}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-slate-500">No guests found</div>
                          )}
                          
                          <div className="border-t border-slate-100 my-1" />
                          
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewGuest(true);
                              setShowGuestDropdown(false);
                              const parts = guestSearch.trim().split(/\s+/);
                              const fName = parts[0] || '';
                              const lName = parts.slice(1).join(' ') || '';
                              setNewGuestForm({
                                firstName: fName,
                                lastName: lName,
                                email: '',
                                phone: ''
                              });
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gold-600 hover:bg-gold-50 font-medium transition-colors flex items-center gap-1.5"
                          >
                            <span>➕</span> Register "{guestSearch || 'New Guest'}" as New Guest
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Room</label>
                <select
                  className="w-full p-2 border rounded-lg bg-white"
                  value={bookingForm.roomId}
                  onChange={(e) => setBookingForm({ ...bookingForm, roomId: e.target.value })}
                >
                  <option value="">Select Room</option>
                  {rooms.map(room => {
                    const statusEmoji = room.status === 'Clean' ? '🟢' : room.status === 'Dirty' ? '🔴' : room.status === 'Inspect' ? '🟡' : room.status === 'Occupied' ? '👤' : '🚫';
                    return (
                      <option key={room.id} value={room.id}>
                        {room.number} - {room.type} ({statusEmoji} {room.status})
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stay Duration Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const tomorrow = new Date();
                      tomorrow.setDate(today.getDate() + 1);
                      setBookingForm({
                        ...bookingForm,
                        checkIn: today.toISOString().split('T')[0],
                        checkOut: tomorrow.toISOString().split('T')[0]
                      });
                      setIsIndefinite(false);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                  >
                    Tonight
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = bookingForm.checkIn ? new Date(bookingForm.checkIn) : new Date();
                      const end = new Date(start);
                      end.setDate(start.getDate() + 1);
                      setBookingForm({
                        ...bookingForm,
                        checkIn: start.toISOString().split('T')[0],
                        checkOut: end.toISOString().split('T')[0]
                      });
                      setIsIndefinite(false);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                  >
                    +1 Night
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = bookingForm.checkIn ? new Date(bookingForm.checkIn) : new Date();
                      const end = new Date(start);
                      end.setDate(start.getDate() + 2);
                      setBookingForm({
                        ...bookingForm,
                        checkIn: start.toISOString().split('T')[0],
                        checkOut: end.toISOString().split('T')[0]
                      });
                      setIsIndefinite(false);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                  >
                    +2 Nights
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const start = bookingForm.checkIn ? new Date(bookingForm.checkIn) : new Date();
                      const end = new Date(start);
                      end.setDate(start.getDate() + 7);
                      setBookingForm({
                        ...bookingForm,
                        checkIn: start.toISOString().split('T')[0],
                        checkOut: end.toISOString().split('T')[0]
                      });
                      setIsIndefinite(false);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
                  <Input type="date" value={bookingForm.checkIn} onChange={(e) => setBookingForm({ ...bookingForm, checkIn: e.target.value })} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Check Out</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        id="indefinite"
                        checked={isIndefinite}
                        onChange={(e) => setIsIndefinite(e.target.checked)}
                        className="rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                      />
                      <label htmlFor="indefinite" className="text-xs text-slate-500 cursor-pointer">Indefinite</label>
                    </div>
                  </div>
                  {!isIndefinite && (
                    <Input type="date" value={bookingForm.checkOut} onChange={(e) => setBookingForm({ ...bookingForm, checkOut: e.target.value })} />
                  )}
                  {isIndefinite && (
                    <div className="p-2 bg-slate-100 text-xs text-slate-500 rounded border border-slate-200 mt-1">
                      Guest is staying indefinitely.
                    </div>
                  )}
                </div>
              </div>

              {conflictWarning && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                  <div className="text-red-600 font-bold text-xs mt-0.5">⚠️</div>
                  <div className="text-xs font-bold text-red-800 leading-relaxed">{conflictWarning}</div>
                </div>
              )}
            </div>

            {/* Starting Balance */}
            {!editingReservationId && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Prior Starting Balance ($) - Optional</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full pl-3 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={startingBalance}
                  onChange={(e: any) => setStartingBalance(e.target.value)}
                  placeholder="e.g. 250.00"
                />
                <p className="text-xs text-slate-500 mt-1">If the guest has an existing balance from before using the system, enter it here.</p>
              </div>
            )}

            {/* 28-Day Override Warning */}
            {(!isIndefinite && bookingForm.checkIn && bookingForm.checkOut && Math.ceil(Math.abs(new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24)) > 28) && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <div className="text-red-600 font-bold text-xs mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Extended Stay Warning</h4>
                    <p className="text-xs text-red-600 mt-1">
                      This reservation exceeds the 28-day policy limit.
                      Tenancy rights may be established after 30 days.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="override"
                        checked={isOverride}
                        onChange={(e) => setIsOverride(e.target.checked)}
                        className="rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor="override" className="text-xs font-bold text-red-700">Authorize 28+ Day Stay Override</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Auto-Calculating Quote Table */}
            {(bookingForm.roomId && bookingForm.checkIn && (bookingForm.checkOut || isIndefinite)) && (
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
                                  }} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-900 pt-1">
                      <span>{isIndefinite ? (new Date(bookingForm.checkIn) < new Date() ? 'Accrued Total' : 'Est. 1st Night') : `Total (${quote.nights} nights)`}</span>
                      <span>${quote.total.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-slate-400 text-xs">Unable to calculate quote</div>
                )}
              </div>
            )}



            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => { setIsBookingModalOpen(false); setEditingReservationId(null); setIsOverride(false); }}>Cancel</Button>
              <Button onClick={handleCreateBooking} disabled={!!conflictWarning}>{editingReservationId ? 'Update Booking' : 'Confirm Booking'}</Button>
            </div>
          </div>
        </div >
      )
      }

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedResForPayment(null);
        }}
        propertyId={user?.propertyId || ''}
        reservationId={selectedResForPayment?.id}
        defaultAmount={selectedResForPayment ? Math.max(0, selectedResForPayment.totalAmount - (selectedResForPayment.totalPaid || 0)) : 0}
        guestName={selectedResForPayment?.guestName}
        onPaymentSuccess={() => {
          alert("Payment recorded successfully via Stripe!");
          fetchReservations(); // Refresh data
        }}
      />

      {
        view === 'list' ? (
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto pb-40">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Guest</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Reservation ID</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Room</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Check In</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Check Out</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Days Stayed</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Total</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {res.guestName}
                          {(() => {
                            const start = new Date(res.checkIn);
                            // If checked in, compare to now. If confirmed, compare to checkout.
                            // Actually user cares about "max stay is 28 days", so we should check the projected total length for everyone.
                            const end = new Date(res.checkOut || Date.now());
                            const duration = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                            if (duration > 28) {
                              return <span title={`Extended Stay: ${duration} days (Limit Exceeded)`}><AlertTriangle className="w-4 h-4 text-red-500" /></span>;
                            } else if (duration >= 25) {
                              return <span title={`Approaching Limit: ${duration} days`}><AlertTriangle className="w-4 h-4 text-amber-500" /></span>;
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-900">{res.friendlyId || res.id.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">#{res.roomNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(res.checkIn).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(res.checkOut).getFullYear() > 2025 ? <span className="italic text-slate-400">Indefinite</span> : new Date(res.checkOut).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const start = new Date(res.checkIn);
                          // Determine relevant end date for calculation
                          // If checked in, we want "days so far" OR "projected total". 
                          // User request: "max stay is 28 days... alerts before 28 days".
                          // It is safer to show the TOTAL projected length for the reservation to see if they booked too long.
                          // But for "force checkout", we might care about "current day count".
                          // Let's show "Projected Total" and maybe highlight if current day is close.
                          // Actually, let's show "Current / Total" if checked in? 
                          // Let's stick to "Reserved Length" which determines the policy violation initially.

                          const end = new Date(res.checkOut);
                          const duration = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

                          let badgeColor = "bg-slate-100 text-slate-700"; // Default
                          if (duration >= 28) badgeColor = "bg-red-100 text-red-700 font-bold border border-red-200";
                          else if (duration >= 25) badgeColor = "bg-amber-100 text-amber-700 font-bold border border-amber-200";
                          else badgeColor = "bg-green-50 text-green-700 border border-green-100";

                          return (
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs ${badgeColor}`}>
                              {duration} Days
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={getStatusColor(res.status)}>{res.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-500 mb-1" title="Charges accrued up to today based on nights stayed + all manual charges">
                            Accrued: ${(res.accruedAmount || 0).toFixed(2)}
                          </span>
                          <span className="font-bold text-slate-900" title="Total charges for the entire scheduled stay">
                            Total: ${(res.totalAmount || 0).toFixed(2)}
                          </span>
                          {(() => {
                            const balance = (res.accruedAmount || 0) - (res.totalPaid || 0);
                            return (
                               <span className={`text-[10px] font-bold mt-1 ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`} title="Balance Due (Accrued - Paid)">
                                  {balance > 0 ? `Due: $${balance.toFixed(2)}` : 'Paid In Full'}
                               </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {res.status === 'Confirmed' && (
                            <button
                              onClick={() => {
                                setReservationToCheckIn(res);
                                setIsCheckInModalOpen(true);
                              }}
                              className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md text-xs font-bold transition-colors"
                              title="Check In"
                            >
                              Check In
                            </button>
                          )}
                          {res.status === 'Checked In' && (
                            <button
                              onClick={() => handleUpdateStatus(res.id, 'Checked Out')}
                              className="text-white bg-slate-700 hover:bg-slate-800 px-3 py-1 rounded-md text-xs font-bold transition-colors"
                              title="Check Out"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedResForPayment(res); setIsPaymentModalOpen(true); }}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors shadow-sm"
                            title="Record Payment"
                          >
                            Payment
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => {
                                console.log("Toggling menu for ID:", res.id, "Current open:", openMenuId);
                                setOpenMenuId(openMenuId === res.id ? null : res.id);
                              }}
                              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenuId === res.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-[9999]">
                                <button
                                  onClick={() => handleEditClick(res)}
                                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit className="w-3 h-3" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(res.id)}
                                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedResForCharge(res);
                                    setIsChargeModalOpen(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <BadgeDollarSign className="w-3 h-3" /> Add Charge
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReservations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
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
                  <div key={room.id} className="grid grid-cols-[100px_1fr] hover:bg-slate-50 relative group" onClick={() => handleRoomClick(room)}>
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
        )}
      {selectedRoom && (
        <RoomDetailsModal
          isOpen={isRoomDetailsModalOpen}
          onClose={() => setIsRoomDetailsModalOpen(false)}
          room={selectedRoom}
        />
      )}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to <strong>permanently delete</strong> this reservation? This action cannot be undone and will remove all associated financial records.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteReservation} icon={Trash2}>Delete Reservation</Button>
          </div>
        </div>
      </Modal>
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => {
          setIsCheckInModalOpen(false);
          setReservationToCheckIn(null);
        }}
        reservation={reservationToCheckIn}
        onConfirm={(id) => {
          handleUpdateStatus(id, 'Checked In');
          setIsCheckInModalOpen(false);
          setReservationToCheckIn(null);
        }}
      />
      <AddChargeModal
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
        reservationId={selectedResForCharge?.id || ''}
        onChargeAdded={() => {
          fetchReservations(); // Refresh list to show updated total/balance
        }}
      />
    </div >
  );
};

export default Reservations;