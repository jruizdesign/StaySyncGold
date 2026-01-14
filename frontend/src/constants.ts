import { Guest, MaintenanceRequest, Reservation, ReservationStatus, Room, RoomStatus, Staff, Transaction } from './types';

export const MOCK_ROOMS: Room[] = Array.from({ length: 20 }, (_, i) => ({
  id: `room-${i + 1}`,
  number: `${100 + i}`,
  type: i % 3 === 0 ? 'Suite' : i % 2 === 0 ? 'Double' : 'King',
  // Distribute statuses: Clean (default), Dirty, Inspect, OOO, Occupied
  status:
    i % 5 === 0 ? RoomStatus.DIRTY :
      i % 7 === 0 ? RoomStatus.INSPECT :
        i % 11 === 0 ? RoomStatus.OOO :
          i % 3 === 0 ? RoomStatus.OCCUPIED : RoomStatus.CLEAN,
  rate: i % 3 === 0 ? 350 : 180,
  floor: 1
}));

export const MOCK_GUESTS: Guest[] = [
  { id: 'g1', fullName: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101', vipStatus: true, notes: 'Prefers quiet rooms.', lastStay: '2023-12-01' },
  { id: 'g2', fullName: 'Bob Smith', email: 'bob@example.com', phone: '555-0102', vipStatus: false, notes: '', lastStay: '2024-01-15' },
  { id: 'g3', fullName: 'Charlie Davis', email: 'charlie@example.com', phone: '555-0103', vipStatus: false, notes: 'Late check-in.' },
  { id: 'g4', fullName: 'Diana Prince', email: 'diana@example.com', phone: '555-0104', vipStatus: true, notes: 'Needs extra pillows.', lastStay: '2024-02-20' },
  { id: 'g5', fullName: 'Ethan Hunt', email: 'ethan@example.com', phone: '555-0105', vipStatus: true, notes: 'Security detail required.', lastStay: '2023-10-10' },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  { id: 'r1', guestId: 'g1', roomId: 'room-1', checkIn: '2024-05-20', checkOut: '2024-05-25', status: ReservationStatus.CHECKED_IN, totalAmount: 1750, guestName: 'Alice Johnson', roomNumber: '100' },
  { id: 'r2', guestId: 'g2', roomId: 'room-3', checkIn: '2024-05-22', checkOut: '2024-05-24', status: ReservationStatus.CONFIRMED, totalAmount: 360, guestName: 'Bob Smith', roomNumber: '102' },
  { id: 'r3', guestId: 'g4', roomId: 'room-5', checkIn: '2024-05-21', checkOut: '2024-05-28', status: ReservationStatus.PENDING, totalAmount: 2450, guestName: 'Diana Prince', roomNumber: '104' },
];

export const MOCK_MAINTENANCE: MaintenanceRequest[] = [
  { id: 'm1', roomId: 'room-2', description: 'AC not cooling', priority: 'High', status: 'In Progress', assignedTo: 'Mike', createdAt: '2024-05-20' },
  { id: 'm2', roomId: 'room-10', description: 'Leaky faucet', priority: 'Low', status: 'Open', createdAt: '2024-05-21' },
];

export const MOCK_STAFF: Staff[] = [
  { id: 's1', name: 'Sarah Connor', role: 'Manager', status: 'Active', shiftStart: '08:00 AM' },
  { id: 's2', name: 'Kyle Reese', role: 'Maintenance', status: 'Active', shiftStart: '09:00 AM' },
  { id: 's3', name: 'T-800', role: 'Housekeeping', status: 'Off Duty' },
  { id: 's4', name: 'John Doe', role: 'Front Desk', status: 'Active', shiftStart: '07:00 AM' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2024-05-20', description: 'Room 100 Payment', amount: 1750, type: 'Credit', category: 'Room Revenue' },
  { id: 't2', date: '2024-05-19', description: 'Vendor: Linen Supply', amount: 500, type: 'Debit', category: 'Supplies' },
  { id: 't3', date: '2024-05-18', description: 'Restaurant Charge - Room 102', amount: 120, type: 'Credit', category: 'F&B' },
  { id: 't4', date: '2024-05-18', description: 'Maintenance Tools', amount: 200, type: 'Debit', category: 'Maintenance' },
];

export const MOCK_GUEST_BALANCES = [
  { id: 'gb1', roomNumber: '101', guestName: 'John Wick', balance: 4500, daysStayed: 12 },
  { id: 'gb2', roomNumber: '105', guestName: 'Sarah Connor', balance: 1200, daysStayed: 4 },
  { id: 'gb3', roomNumber: '204', guestName: 'Ellen Ripley', balance: 850, daysStayed: 3 },
  { id: 'gb4', roomNumber: '302', guestName: 'Marty McFly', balance: 2100, daysStayed: 7 },
  { id: 'gb5', roomNumber: '401', guestName: 'Tony Stark', balance: 15000, daysStayed: 30 },
];