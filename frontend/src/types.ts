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
  propertyId: string;
}

export interface Room {
  id: string;
  number: string;
  type: string;
  status: RoomStatus;
  price_per_night: number;
  floor: number;
  capacity: number;
}

export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string; // ISO Date
  checkOut: string; // ISO Date
  status: ReservationStatus;
  totalAmount: number;
  accruedAmount?: number; // Calculated dynamic charge up to current date
  guestName: string; // Denormalized for ease
  roomNumber: string; // Denormalized for ease
  friendlyId?: string; // e.g., BVN-1001
  totalPaid?: number; // Optional as it might be aggregated on the fly
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
  property_id: string;
  firstname: string;
  last_name: string;
  name?: string; // Optional/Computed
  role: 'Admin' | 'Front Desk' | 'Housekeeping' | 'Maintenance' | 'Manager';
  status: 'active' | 'inactive'; // Employment status
  email?: string;
  pin: string;
  pin_code: string;
  avatar_url?: string;
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
  organization_name?: string;
  address?: string;
  createdAt: string;
  demo_mode?: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  propertyId?: string; // Foreign key to Property
  propertyName?: string; // Fetched name of the property
  isAdmin?: boolean;
  isManager?: boolean;
  isDemoMode?: boolean;
}

export interface Invoice {
  id: string;
  guestId: string;
  propertyId: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Cancelled';
  dueDate: string;
  createdAt: string;
  items: { description: string; amount: number }[];
}

export interface StaffShift {
  id: string;
  staff_id: string;
  property_id: string;
  clock_in: string;
  clock_out?: string;
  status: 'active' | 'on_break' | 'completed';
  created_at: string;
}

export interface StaffBreak {
  id: string;
  shift_id: string;
  start_time: string;
  end_time?: string;
  created_at: string;
}

export interface ChannelSetting {
  id: string;
  property_id: string;
  channel_name: string;
  api_key?: string;
  property_mapping_id?: string;
  is_active: boolean;
  last_sync?: string;
  status: string;
  created_at: string;
}

export interface ChannelMapping {
  id: string;
  channel_setting_id: string;
  local_room_type?: string;
  channel_room_id?: string;
}