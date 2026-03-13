

const SEED_DATA = {
    properties: [
        { id: 'mock-property-1', name: 'Cardea Grand Hotel', location: 'Metropolis', demo_mode: true }
    ],
    users: [
        { id: 'mock-admin-1', email: 'demo@cardea.app', role: 'admin', property_id: 'mock-property-1', isAdmin: true, isManager: true }
    ],
    rooms: [
        { id: 'room-101', property_id: 'mock-property-1', number: '101', type: 'King Suite', status: 'Clean', price_per_night: 250 },
        { id: 'room-102', property_id: 'mock-property-1', number: '102', type: 'Double Queen', status: 'Occupied', price_per_night: 180 },
        { id: 'room-103', property_id: 'mock-property-1', number: '103', type: 'Standard', status: 'Dirty', price_per_night: 120 },
        { id: 'room-104', property_id: 'mock-property-1', number: '104', type: 'King Suite', status: 'Clean', price_per_night: 250 },
        { id: 'room-105', property_id: 'mock-property-1', number: '105', type: 'Double Queen', status: 'Maintenance', price_per_night: 180 },
    ],
    guests: [
        { id: 'guest-1', property_id: 'mock-property-1', first_name: 'John', last_name: 'Doe', email: 'johndoe@example.com', phone: '555-0100' },
        { id: 'guest-2', property_id: 'mock-property-1', first_name: 'Jane', last_name: 'Smith', email: 'janesmith@example.com', phone: '555-0101' },
    ],
    reservations: [
        {
            id: 'res-1', property_id: 'mock-property-1', guest_id: 'guest-1', room_id: 'room-102',
            status: 'checked_in', check_in: new Date().toISOString(), check_out: new Date(Date.now() + 86400000 * 2).toISOString(),
            total_price: 360, amount_paid: 180
        },
        {
            id: 'res-2', property_id: 'mock-property-1', guest_id: 'guest-2', room_id: 'room-101',
            status: 'confirmed', check_in: new Date(Date.now() + 86400000).toISOString(), check_out: new Date(Date.now() + 86400000 * 3).toISOString(),
            total_price: 500, amount_paid: 0
        }
    ],
    housekeeping_tasks: [
        { id: 'task-1', property_id: 'mock-property-1', room_id: 'room-103', task_type: 'Cleaning', status: 'Pending', priority: 'High', assigned_to: null }
    ],
    maintenance_tickets: [
        { id: 'ticket-1', property_id: 'mock-property-1', room_id: 'room-105', issueUrl: null, description: 'AC unit making noise', status: 'open', severity: 'Medium', category: 'HVAC' }
    ],
    payments: [
        { id: 'pay-1', property_id: 'mock-property-1', reservation_id: 'res-1', amount: 180, currency: 'usd', status: 'succeeded', payment_method: 'card', created_at: new Date().toISOString() }
    ]
};

export const initMockDb = () => {
    if (!localStorage.getItem('MOCK_DB_INITIALIZED')) {
        Object.keys(SEED_DATA).forEach(key => {
            localStorage.setItem(`mock_${key}`, JSON.stringify(SEED_DATA[key as keyof typeof SEED_DATA]));
        });
        localStorage.setItem('MOCK_DB_INITIALIZED', 'true');
    }
};

const getTableData = (table: string) => JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');
const setTableData = (table: string, data: any) => localStorage.setItem(`mock_${table}`, JSON.stringify(data));

export const mockFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = url.toString();
    console.log('[Mock DB] Intercepted request:', urlStr, init?.method);

    // Extract table name from PostgREST url e.g. /rest/v1/reservations
    const match = urlStr.match(/\/rest\/v1\/([^?]+)/);
    if (!match) {
        if (urlStr.includes('/auth/v1/user') || urlStr.includes('/auth/v1/session')) {
            return new Response(JSON.stringify({ id: 'mock-admin-1', email: 'demo@cardea.app', role: 'authenticated' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        console.warn('[Mock DB] Unhandled route:', urlStr);
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const table = match[1];
    const method = init?.method || 'GET';
    const data = getTableData(table);

    if (method === 'GET') {
        const urlParams = new URLSearchParams(urlStr.split('?')[1]);
        let filtered = [...data];
        urlParams.forEach((value, key) => {
            if (key !== 'select' && value.startsWith('eq.')) {
                const eqVal = value.substring(3);
                filtered = filtered.filter((item: any) => String(item[key]) === eqVal);
            }
        });
        return new Response(JSON.stringify(filtered), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'POST') {
        const body = JSON.parse(init?.body as string);
        const newItems = Array.isArray(body) ? body : [body];
        newItems.forEach((item: any) => {
            if (!item.id) item.id = crypto.randomUUID();
            data.push(item);
        });
        setTableData(table, data);
        return new Response(JSON.stringify(body), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'PATCH') {
        const body = JSON.parse(init?.body as string);
        const urlParams = new URLSearchParams(urlStr.split('?')[1]);
        const idFilter = urlParams.get('id');
        if (idFilter && idFilter.startsWith('eq.')) {
            const targetId = idFilter.substring(3);
            const index = data.findIndex((item: any) => String(item.id) === targetId);
            if (index > -1) {
                data[index] = { ...data[index], ...body };
                setTableData(table, data);
                return new Response(JSON.stringify([data[index]]), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }
        return new Response(JSON.stringify({ error: "Patch target not found" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'DELETE') {
        const urlParams = new URLSearchParams(urlStr.split('?')[1]);
        const idFilter = urlParams.get('id');
        if (idFilter && idFilter.startsWith('eq.')) {
            const targetId = idFilter.substring(3);
            const newData = data.filter((item: any) => String(item.id) !== targetId);
            setTableData(table, newData);
            return new Response(null, { status: 204 });
        }
        return new Response(JSON.stringify({ error: "Delete target not found" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
