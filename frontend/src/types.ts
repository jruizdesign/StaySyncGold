export enum RoomStatus {
  CLEAN = 'Clean',
  DIRTY = 'Dirty',
  INSPECT = 'Inspect',
  OOO = 'Out of Order',
  OCCUPIED = 'Occupied'
}

export enum ReservationStatus {
  CONFIRMED = 'Confirmed',
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
  CANCELLED = 'Cancelled',
  PENDING = 'Pending'
}

export interface Guest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vipStatus: boolean;
  notes: string;
  lastStay?: string;
  doNotRent?: boolean;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: RoomStatus;
  rate: number;
  floor: number;
}

export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string; // ISO Date
  checkOut: string; // ISO Date
  status: ReservationStatus;
  totalAmount: number;
  guestName: string; // Denormalized for ease
  roomNumber: string; // Denormalized for ease
}

export interface MaintenanceRequest {
  id: string;
  roomId: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo?: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Admin' | 'Front Desk' | 'Housekeeping' | 'Maintenance' | 'Manager';
  status: 'Active' | 'On Break' | 'Off Duty';
  shiftStart?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  category: string;
}

export interface Property {
  id: string;
  name: string;
  address?: string;
  createdAt: string;
  demo_mode?: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  propertyId?: string; // Foreign key to Property
  isAdmin?: boolean;
  isManager?: boolean;
}