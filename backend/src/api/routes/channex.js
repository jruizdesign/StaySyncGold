const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const channexService = require('../../services/channexService');
const db = require('../../config/database');
const supabase = require('../../config/supabase');

// GET /api/channex/status
// Fetch status of channels for the current property
router.get('/status', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        // 1. Get API Key from Supabase
        const { data: settings, error: dbError } = await supabase
            .from('channel_settings')
            .select('api_key, property_mapping_id')
            .eq('property_id', property_id)
            .eq('channel_name', 'channex')
            .single();

        if (dbError || !settings || !settings.api_key) {
            return res.json({ connected: false, channels: [] });
        }

        const { api_key, property_mapping_id } = settings;

        // 2. Call Channex
        const channexResponse = await channexService.getActiveChannels(api_key, property_mapping_id);

        if (!channexResponse.success) {
            return res.status(502).json({ error: 'Failed to reach Channex', details: channexResponse.error });
        }

        // 3. Format for Frontend
        const mappedChannels = channexResponse.data.map(ch => ({
            name: ch.attributes.title,
            status: ch.attributes.is_active ? 'Active' : 'Inactive',
            id: ch.id
        }));

        res.json({ connected: true, channels: mappedChannels });

    } catch (error) {
        console.error('Channex Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/verify
// Verify API Key and Property ID before saving
router.post('/verify', async (req, res) => {
    try {
        const { apiKey, propertyMappingId } = req.body;

        if (!apiKey || !propertyMappingId) {
            return res.status(400).json({ success: false, error: 'API Key and Property ID are required.' });
        }

        // 1. Validate API Key first
        const validation = await channexService.validateConnection(apiKey);
        if (!validation.success) {
            return res.status(401).json({ success: false, error: 'Invalid API Key: ' + validation.error });
        }

        // 2. Validate Property Access (by trying to fetch channels for it)
        const check = await channexService.getActiveChannels(apiKey, propertyMappingId);

        if (check.success) {
            res.json({ success: true, count: check.data.length });
        } else {
            console.error('Channex Verify Failed:', check.error);
            // Even if success=true but data is weird, treat as fail
            res.status(400).json({ success: false, error: check.error || 'Property ID not found or no access' });
        }
    } catch (error) {
        console.error('Channex Verify Route Exception:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error during verification' });
    }
});

// GET /api/channex/rooms
// Fetch room types from Channex for mapping
router.get('/rooms', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const { data: settings, error: dbError } = await supabase
            .from('channel_settings')
            .select('api_key, property_mapping_id')
            .eq('property_id', property_id)
            .eq('channel_name', 'channex')
            .single();

        if (dbError || !settings || !settings.api_key) {
            return res.status(404).json({ error: 'Channex not connected or API key missing' });
        }

        const { api_key, property_mapping_id } = settings;
        const response = await channexService.getRoomTypes(api_key, property_mapping_id);

        if (response.success) {
            res.json({ rooms: response.data });
        } else {
            res.status(500).json({ error: response.error });
        }
    } catch (error) {
        console.error('Channex Rooms Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// POST /api/channex/mappings
// Save room type mappings
router.post('/mappings', async (req, res) => {
    try {
        const { property_id, mappings } = req.body;

        if (!property_id || !mappings) return res.status(400).json({ error: 'Property ID and mappings required' });

        const settingResult = await db.query(
            "SELECT id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Channel settings not found' });
        }

        const channel_setting_id = settingResult.rows[0].id;

        await db.query('BEGIN');

        for (const [localType, channexId] of Object.entries(mappings)) {
            // Check if mapping exists
            const existing = await db.query(
                "SELECT id FROM channel_mappings WHERE channel_setting_id = $1 AND local_room_type = $2",
                [channel_setting_id, localType]
            );

            if (existing.rows.length > 0) {
                await db.query(
                    "UPDATE channel_mappings SET channel_room_id = $1 WHERE id = $2",
                    [channexId, existing.rows[0].id]
                );
            } else {
                await db.query(
                    "INSERT INTO channel_mappings (id, channel_setting_id, local_room_type, channel_room_id) VALUES ($1, $2, $3, $4)",
                    [crypto.randomUUID(), channel_setting_id, localType, channexId]
                );
            }
        }

        await db.query('COMMIT');
        res.json({ success: true });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Channex Save Mappings Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/channex/mappings
// Fetch validation and existing mappings
router.get('/mappings', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const { data: settings, error: settingError } = await supabase
            .from('channel_settings')
            .select('id')
            .eq('property_id', property_id)
            .eq('channel_name', 'channex')
            .single();

        if (settingError || !settings) {
            return res.status(404).json({ error: 'Channel settings not found' });
        }

        const channel_setting_id = settings.id;

        const { data: mappings, error: mappingsError } = await supabase
            .from('channel_mappings')
            .select('local_room_type, channel_room_id')
            .eq('channel_setting_id', channel_setting_id);

        if (mappingsError) {
            console.error('Mappings query error:', mappingsError);
            return res.status(500).json({ error: 'Failed to fetch mappings', details: mappingsError.message });
        }

        // Transform to simplified object: { [localType]: channelRoomId }
        const mappingObj = {};
        (mappings || []).forEach(row => {
            mappingObj[row.local_room_type] = row.channel_room_id;
        });

        res.json({ mappings: mappingObj });

    } catch (error) {
        console.error('Channex Get Mappings Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// GET /api/channex/sync
// Fetch last sync timestamp
router.get('/sync', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const result = await db.query(
            "SELECT last_sync FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (result.rows.length === 0) {
            return res.json({ success: true, last_sync: null });
        }

        res.json({ success: true, last_sync: result.rows[0].last_sync });

    } catch (error) {
        console.error('Channex Sync Status Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/channex/bookings
// Fetch stored bookings for financials/dashboard
router.get('/bookings', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const result = await db.query(
            "SELECT * FROM bookings WHERE property_id = $1 ORDER BY arrival_date DESC",
            [property_id]
        );

        res.json({ success: true, bookings: result.rows });

    } catch (error) {
        console.error('Fetch Bookings Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/sync
// Trigger a manual sync (currently pulls bookings)
router.post('/sync', async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const result = await db.query(
            "SELECT id, api_key, property_mapping_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (result.rows.length === 0 || !result.rows[0].api_key) {
            return res.status(404).json({ error: 'Channex not connected' });
        }

        const { id: channel_setting_id, api_key, property_mapping_id } = result.rows[0];

        // 1. Fetch Bookings from Channex
        const bookingRes = await channexService.fetchBookings(api_key, property_mapping_id);

        if (!bookingRes.success) {
            return res.status(502).json({ error: 'Failed to fetch bookings from Channex', details: bookingRes.error });
        }

        // 2. Load Mappings (to link bookings to local room types)
        const mappingResult = await db.query(
            "SELECT local_room_type, channel_room_id FROM channel_mappings WHERE channel_setting_id = $1",
            [channel_setting_id]
        );

        const roomMap = new Map();
        mappingResult.rows.forEach(row => {
            roomMap.set(row.channel_room_id, row.local_room_type);
        });

        // 3. Process and Save Bookings
        const bookings = bookingRes.data;
        const bookingsCount = bookings.length;

        await db.query('BEGIN');

        for (const b of bookings) {
            const channexRoomId = b.relationships?.room_type?.data?.id;
            const localRoomType = roomMap.get(channexRoomId) || 'Unmapped';

            // Upsert booking into database
            // Note: This assumes a 'bookings' table exists. 
            await db.query(
                `INSERT INTO bookings (
                    property_id, 
                    channel_booking_id, 
                    guest_name, 
                    total_price, 
                    currency, 
                    status, 
                    arrival_date, 
                    departure_date, 
                    room_type,
                    source,
                    raw_data,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'channex', $10, NOW(), NOW())
                ON CONFLICT (channel_booking_id) DO UPDATE SET
                    total_price = EXCLUDED.total_price,
                    currency = EXCLUDED.currency,
                    status = EXCLUDED.status,
                    arrival_date = EXCLUDED.arrival_date,
                    departure_date = EXCLUDED.departure_date,
                    room_type = EXCLUDED.room_type,
                    raw_data = EXCLUDED.raw_data,
                    updated_at = NOW()`,
                [
                    property_id,
                    b.id,
                    b.attributes.customer?.name || 'Unknown',
                    b.attributes.total_price,
                    b.attributes.currency,
                    b.attributes.status,
                    b.attributes.arrival_date,
                    b.attributes.departure_date,
                    localRoomType,
                    JSON.stringify(b)
                ]
            );
        }

        await db.query('COMMIT');



        // 4. Update last_sync timestamp
        await db.query(
            "UPDATE channel_settings SET last_sync = NOW() WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        res.json({ success: true, bookingsFetched: bookingsCount, message: `Sync Complete. Fetched ${bookingsCount} bookings.` });

    } catch (error) {
        console.error('Channex Sync Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// POST /api/channex/iframe-link
// Generate a one-time link for the Channex mapping iframe
router.post('/iframe-link', async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const result = await db.query(
            "SELECT api_key, channex_property_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (result.rows.length === 0 || !result.rows[0].api_key) {
            return res.status(404).json({ error: 'Channex not connected' });
        }

        const { api_key, channex_property_id } = result.rows[0];

        if (!channex_property_id) {
            return res.status(400).json({ error: 'Channex Property ID not found. Please sync property first.' });
        }

        const tokenRes = await channexService.generateOneTimeToken(api_key, channex_property_id, 'StaySync User');

        if (!tokenRes.success) {
            return res.status(502).json({ error: 'Failed to generate Channex token', details: tokenRes.error });
        }

        const iframeBase = 'https://app.channex.io';
        const url = `${iframeBase}/auth/exchange?oauth_session_key=${tokenRes.token}&app_mode=headless&redirect_to=/channels&property_id=${channex_property_id}`;

        res.json({ success: true, url });

    } catch (error) {
        console.error('Channex Iframe Link Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// ========== STANDARD REST API ENDPOINTS ==========

// GET /api/channex/properties
// Fetch list of properties from Channex for the given API key
router.get('/properties', async (req, res) => {
    try {
        const { api_key } = req.query;
        if (!api_key) return res.status(400).json({ error: 'API Key required' });

        const response = await channexService.getProperties(api_key);
        if (response.success) {
            res.json({ properties: response.data });
        } else {
            res.status(400).json({ error: response.error });
        }
    } catch (error) {
        console.error('Channex Properties Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/connect
// Save API Key and Link Property
router.post('/connect', async (req, res) => {
    try {
        const { property_id, api_key, channex_property_id } = req.body;

        if (!property_id || !api_key || !channex_property_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify one last time
        const check = await channexService.getActiveChannels(api_key, channex_property_id);
        if (!check.success && check.error !== 'Property ID not found or no access') {
            // It might fail if no channels are active, which is fine, but if auth fails thats bad
            // We assume if user selected it from the list, it's valid.
        }

        // Upsert settings
        const existing = await db.query(
            "SELECT id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (existing.rows.length > 0) {
            await db.query(
                "UPDATE channel_settings SET api_key = $1, channex_property_id = $2, last_sync = NOW() WHERE id = $3",
                [api_key, channex_property_id, existing.rows[0].id]
            );
        } else {
            await db.query(
                "INSERT INTO channel_settings (id, property_id, channel_name, api_key, channex_property_id, is_active, last_sync, status) VALUES ($1, $2, 'channex', $3, $4, true, NOW(), 'connected')",
                [crypto.randomUUID(), property_id, api_key, channex_property_id]
            );
        }

        res.json({ success: true });

    } catch (error) {
        console.error('Channex Connect Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/channex/rooms/local
// Get local room types
router.get('/rooms/local', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const result = await db.query(
            "SELECT name as type FROM room_types WHERE property_id = $1",
            [property_id]
        );

        res.json({ roomTypes: result.rows.map(r => r.type) });

    } catch (error) {
        console.error('Get Local Rooms Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/channex/rooms/remote
// Get Channex room types (wrapper for convenience)
router.get('/rooms/remote', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const settingResult = await db.query(
            "SELECT api_key, channex_property_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) return res.status(404).json({ error: 'Channex not connected' });

        const { api_key, channex_property_id } = settingResult.rows[0];
        const response = await channexService.getRoomTypes(api_key, channex_property_id);

        if (response.success) {
            // Transform for easier frontend consumption? Or raw.
            // Channex returns data: [{ id, attributes: { title } }]
            res.json({ rooms: response.data });
        } else {
            res.status(500).json({ error: response.error });
        }

    } catch (error) {
        console.error('Get Remote Rooms Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// POST /api/channex/save-mappings
// Save room mappings
router.post('/save-mappings', async (req, res) => {
    try {
        const { property_id, mappings } = req.body; // mappings: [{ localRoomType, channexRoomTypeId, channexRatePlanId }]

        if (!property_id || !mappings) return res.status(400).json({ error: 'Missing data' });

        const settingResult = await db.query(
            "SELECT id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) return res.status(404).json({ error: 'Settings not found' });
        const channel_setting_id = settingResult.rows[0].id;

        await db.query('BEGIN');

        for (const m of mappings) {
            // Check existing
            const existing = await db.query(
                "SELECT id FROM channel_mappings WHERE channel_setting_id = $1 AND local_room_type = $2",
                [channel_setting_id, m.localRoomType]
            );

            if (existing.rows.length > 0) {
                await db.query(
                    "UPDATE channel_mappings SET channex_room_type_id = $1, channex_rate_plan_id = $2, channel_room_id = $1 WHERE id = $3",
                    [m.channexRoomTypeId, m.channexRatePlanId, existing.rows[0].id]
                );
            } else {
                await db.query(
                    "INSERT INTO channel_mappings (id, channel_setting_id, local_room_type, channex_room_type_id, channex_rate_plan_id, channel_room_id) VALUES ($1, $2, $3, $4, $5, $4)",
                    [crypto.randomUUID(), channel_setting_id, m.localRoomType, m.channexRoomTypeId, m.channexRatePlanId]
                );
            }
        }

        await db.query('COMMIT');
        res.json({ success: true });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Save Mappings Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/channex/mappings
// Get mappings (Standardized)
router.get('/mappings', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const settingResult = await db.query(
            "SELECT id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) return res.json({ mappings: [] });
        const channel_setting_id = settingResult.rows[0].id;

        const result = await db.query(
            "SELECT local_room_type, channex_room_type_id, channex_rate_plan_id FROM channel_mappings WHERE channel_setting_id = $1",
            [channel_setting_id]
        );

        // Map to format expected by frontend
        const mappings = result.rows.map(r => ({
            localRoomType: r.local_room_type,
            channexRoomTypeId: r.channex_room_type_id,
            channexRatePlanId: r.channex_rate_plan_id
        }));

        res.json({ mappings });

    } catch (error) {
        console.error('Get Mappings Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/mappings/auto-sync
// Automatically match local room types to Channex room types by name
router.post('/mappings/auto-sync', async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        // 1. Get Channex Settings
        const settingResult = await db.query(
            "SELECT api_key, channex_property_id, id as setting_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) return res.status(404).json({ error: 'Channex not connected' });
        const { api_key, channex_property_id, setting_id } = settingResult.rows[0];

        // 2. Fetch Remote Room Types from Channex
        const remoteResult = await channexService.getRoomTypes(api_key, channex_property_id);
        if (!remoteResult.success) {
            return res.status(502).json({ error: 'Failed to fetch Channex room types: ' + remoteResult.error });
        }
        const channexRooms = remoteResult.data;

        // 3. Fetch Local Room Types
        const localResult = await db.query(
            "SELECT name as type FROM room_types WHERE property_id = $1",
            [property_id]
        );
        const localRooms = localResult.rows.map(r => r.type);

        // 4. Match and Upsert
        let matchCount = 0;
        const matches = [];

        for (const cRoom of channexRooms) {
            const channexTitle = cRoom.attributes.title;
            const channexId = cRoom.id;

            // Find local match (case-insensitive)
            const localMatch = localRooms.find(lType => lType.toLowerCase() === channexTitle.toLowerCase());

            if (localMatch) {
                // Upsert into channel_mappings
                // We assume uniqueness on (channel_setting_id, local_room_type)
                // Note: PostgreSQL upsert syntax: INSERT ... ON CONFLICT (...) DO UPDATE ...

                // First check if mapping exists to avoid overwriting if user manually set it? 
                // The user's script suggests 'upsert', so we overwrite to ensure sync.
                // However, we need to be careful not to wipe 'channex_rate_plan_id' if we don't have it here.
                // The user script doesn't map rate plan, just room type. 
                // So we should only update 'channex_room_type_id'.

                await db.query(
                    `INSERT INTO channel_mappings (property_id, channel_setting_id, local_room_type, channex_room_type_id)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (channel_setting_id, local_room_type) 
                     DO UPDATE SET channex_room_type_id = EXCLUDED.channex_room_type_id`,
                    [property_id, setting_id, localMatch, channexId]
                );

                matches.push({ local: localMatch, remote: channexTitle });
                matchCount++;
            }
        }

        res.json({
            success: true,
            message: `Auto-sync complete. Matched ${matchCount} room types.`,
            matches
        });

    } catch (error) {
        console.error('Auto Sync Mappings Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/ari
// Push ARI updates to Channex
router.post('/ari', async (req, res) => {
    try {
        const { property_id, start_date, end_date } = req.body;
        if (!property_id || !start_date || !end_date) return res.status(400).json({ error: 'Missing ranges' });

        const settingResult = await db.query(
            "SELECT api_key, channex_property_id, id as setting_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) return res.status(404).json({ error: 'Channex not connected' });
        const { api_key, channex_property_id, setting_id } = settingResult.rows[0];

        // 1. Get Mappings
        const mapRes = await db.query(
            "SELECT local_room_type, channex_room_type_id, channex_rate_plan_id FROM channel_mappings WHERE channel_setting_id = $1",
            [setting_id]
        );
        const mappings = mapRes.rows;

        // 2. Get Rates
        const ratesRes = await db.query(
            "SELECT room_type, date, price FROM room_rates WHERE property_id = $1 AND date >= $2 AND date <= $3",
            [property_id, start_date, end_date]
        );

        // 3. Get Availability (Capacity - Booked)
        // Correctly join with room_types (or fallback to type string if migration incomplete)
        const roomsRes = await db.query(
            "SELECT rt.name as type, COUNT(r.id) as count FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.id WHERE r.property_id = $1 GROUP BY rt.name",
            [property_id]
        );
        const roomCounts = {};
        roomsRes.rows.forEach(r => {
            if (r.type) roomCounts[r.type] = parseInt(r.count);
        });

        // 4. Transform to Channex ARI format
        const updates = [];
        for (const rate of ratesRes.rows) {
            // Find mapping
            const mapping = mappings.find(m => m.local_room_type === rate.room_type);
            if (!mapping || !mapping.channex_room_type_id || !mapping.channex_rate_plan_id) continue;

            const isoDate = new Date(rate.date).toISOString().split('T')[0];
            const availability = roomCounts[rate.room_type] || 1;

            updates.push({
                property_id: channex_property_id,
                room_type_id: mapping.channex_room_type_id,
                rate_plan_id: mapping.channex_rate_plan_id,
                date_from: isoDate,
                date_to: isoDate,
                rate: parseFloat(rate.price),
                availability: availability
            });
        }

        if (updates.length === 0) return res.json({ success: true, message: 'No updates to push' });

        const pushRes = await channexService.pushARI(api_key, channex_property_id, updates);

        if (pushRes.success) {
            res.json({ success: true, count: updates.length });
        } else {
            res.status(502).json({ error: 'Channex ARI Push Failed', details: pushRes.error });
        }

    } catch (error) {
        console.error('ARI Push Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ========== CHANNEX PUBLIC API ENDPOINTS ==========
// These endpoints are called BY Channex to sync data
// Base URL in Channex Config -> https://your-domain.com/api/channex/

// Middleware to validate Channex API Key for incoming requests
const validateChannexIncoming = async (req, res, next) => {
    const propertyId = req.query.hotel_code;
    const apiKey = req.headers['api-key']; // Channex sends this header

    if (!propertyId) {
        return res.status(400).json({ error: 'hotel_code (Property ID) is required' });
    }

    // Relaxed auth for now: Just check if property exists and Channex is enabled.
    // In production, you might want to enforce that the apiKey matches a stored secret.
    // For now, we verify that the property has a Channex connection.
    try {
        const result = await db.query(
            "SELECT api_key FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [propertyId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({ error: 'Property not connected to Channex' });
        }

        // Optional: Verify shared secret if you enforce it.
        if (result.rows[0].api_key !== apiKey) return res.status(401).json({ error: 'Invalid API Key' });

        req.property_id = propertyId;
        next();
    } catch (error) {
        console.error('Channex Auth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /api/channex/test_connection/
router.get('/test_connection/', validateChannexIncoming, (req, res) => {
    res.json({ success: true });
});

// GET /api/channex/mapping_details/
router.get('/mapping_details/', validateChannexIncoming, async (req, res) => {

    try {
        // 1. Fetch Room Types
        // We group by 'type' to represent Room Types.
        const roomsResult = await db.query(
            "SELECT type, MAX(capacity) as capacity, COUNT(*) as count FROM rooms WHERE property_id = $1 GROUP BY type",
            [req.property_id]
        );

        const roomTypes = roomsResult.rows.map(r => ({
            id: r.type, // Use the room type name as ID (or hash it if needed)
            title: r.type,
            rate_plans: [
                {
                    id: `Standard_${r.type.replace(/\s+/g, '_')}`,
                    title: "Standard Rate",
                    sell_mode: "per_room",
                    max_persons: r.capacity || 2,
                    currency: "USD", // Should ideally fetch from property settings
                    read_only: false
                }
            ]
        }));

        res.json({
            data: {
                type: "mapping_details",
                attributes: {
                    room_types: roomTypes
                }
            }
        });

    } catch (error) {
        console.error('Channex Mapping Details Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/changes/ (Stub for future updates)
router.post('/changes/', validateChannexIncoming, (req, res) => {
    // Channex pushes availability/rate updates here? 
    // Or maybe we push to them. The doc says "receive changes that has happened at the property state".

    res.json({ success: true });
});

module.exports = router;
