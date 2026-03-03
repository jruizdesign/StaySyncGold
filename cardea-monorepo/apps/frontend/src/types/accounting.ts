export interface AccountingStat {
    label: string;
    value: number | string;
    trend?: number; // percentage
    type: 'currency' | 'percent' | 'count';
    color?: string;
}

export interface DebtItem {
    [x: string]: string | number;
    id: string; // Booking ID
    guestName: string;
    room: string;
    balance: number;
    checkout: string; // ISO Date
    status: string;
    score: number;
    priorityLabel: string;
}

export interface LedgerEntry {
    id: string;
    created_at?: string;
    arrival_date: string;
    guest_name: string;
    room_type: string;
    total_price: number;
    status: string;
}

export interface DailyFinancialData {
    receivables: number;
    revenueYTD: number;
    projectedInput: number;
    occupancyEfficiency: number;
}
