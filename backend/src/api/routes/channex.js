const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const channexService = require('../../services/channexService');
const db = require('../../config/database');

// GET /api/channex/status
// Fetch status of channels for the current property
router.get('/status', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        // 1. Get API Key from DB
        const result = await db.query(
            "SELECT api_key, property_mapping_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (result.rows.length === 0) {
            return res.json({ connected: false, channels: [] });
        }

        const { api_key, property_mapping_id } = result.rows[0];

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

        const result = await db.query(
            "SELECT api_key, property_mapping_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Channex not connected' });
        }

        const { api_key, property_mapping_id } = result.rows[0];
        const response = await channexService.getRoomTypes(api_key, property_mapping_id);

        if (response.success) {
            res.json({ rooms: response.data });
        } else {
            res.status(500).json({ error: response.error });
        }
    } catch (error) {
        console.error('Channex Rooms Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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

        const settingResult = await db.query(
            "SELECT id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Channel settings not found' });
        }

        const channel_setting_id = settingResult.rows[0].id;

        const mappings = await db.query(
            "SELECT local_room_type, channel_room_id FROM channel_mappings WHERE channel_setting_id = $1",
            [channel_setting_id]
        );

        // Transform to simplified object: { [localType]: channelRoomId }
        const mappingObj = {};
        mappings.rows.forEach(row => {
            mappingObj[row.local_room_type] = row.channel_room_id;
        });

        res.json({ mappings: mappingObj });

    } catch (error) {
        console.error('Channex Get Mappings Error:', error);
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
            "SELECT api_key, property_mapping_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Channex not connected' });
        }

        const { api_key, property_mapping_id } = result.rows[0];

        // 1. Fetch Bookings from Channex
        const bookingRes = await channexService.fetchBookings(api_key, property_mapping_id);

        if (!bookingRes.success) {
            return res.status(502).json({ error: 'Failed to fetch bookings from Channex', details: bookingRes.error });
        }

        // 2. Process Bookings (Log details to confirm connection)
        const bookings = bookingRes.data;
        const bookingsCount = bookings.length;

        const summary = bookings.map(b => ({
            id: b.id,
            guest: b.attributes.customer?.name || 'Unknown',
            status: b.attributes.status,
            arrival: b.attributes.arrival_date
        }));

        console.log(`[Channex Sync] Fetched ${bookingsCount} bookings for property ${property_id}:`, summary);

        // 3. Update last_sync timestamp
        await db.query(
            "UPDATE channel_settings SET last_sync = NOW() WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        res.json({ success: true, bookingsFetched: bookingsCount, message: `Sync Complete. Fetched ${bookingsCount} bookings.` });

    } catch (error) {
        console.error('Channex Sync Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
