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

        if (dbError || !settings) {
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

// ========== MCP-SPECIFIC ROUTES ==========
// These routes are designed to work with the Channex MCP server

// POST /api/channex/mcp/property/sync
// Prepare property data for MCP sync
router.post('/mcp/property/sync', async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        // Get property details from Supabase
        const propertyResult = await db.query(
            "SELECT * FROM properties WHERE id = $1",
            [property_id]
        );

        if (propertyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }

        const property = propertyResult.rows[0];

        // Get API key
        const settingResult = await db.query(
            "SELECT api_key, channex_property_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Channex not configured for this property' });
        }

        const { api_key, channex_property_id } = settingResult.rows[0];

        // Return property data for MCP sync
        res.json({
            success: true,
            message: 'Property data ready for MCP sync',
            property: {
                id: property.id,
                name: property.name || property.location,
                address: property.location,
                channexPropertyId: channex_property_id
            },
            requiresMcpSync: true
        });

    } catch (error) {
        console.error('MCP Property Sync Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/mcp/property/save-id
// Save Channex property ID after successful MCP sync
router.post('/mcp/property/save-id', async (req, res) => {
    try {
        const { property_id, channex_property_id } = req.body;

        if (!property_id || !channex_property_id) {
            return res.status(400).json({ error: 'Property ID and Channex Property ID are required' });
        }

        await db.query(
            "UPDATE channel_settings SET channex_property_id = $1, last_sync = NOW() WHERE property_id = $2 AND channel_name = 'channex'",
            [channex_property_id, property_id]
        );

        res.json({
            success: true,
            message: 'Channex property ID saved successfully'
        });

    } catch (error) {
        console.error('Save Property ID Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/channex/mcp/room-types/local
// Get local room types for mapping
router.get('/mcp/room-types/local', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const result = await db.query(
            "SELECT DISTINCT type FROM rooms WHERE property_id = $1",
            [property_id]
        );

        const roomTypes = result.rows.map(row => row.type);

        res.json({
            success: true,
            roomTypes
        });

    } catch (error) {
        console.error('Get Local Room Types Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/mcp/mappings/save
// Save room type mapping with Channex IDs
router.post('/mcp/mappings/save', async (req, res) => {
    try {
        const { property_id, local_room_type, channex_room_type_id, channex_rate_plan_id } = req.body;

        if (!property_id || !local_room_type || !channex_room_type_id) {
            return res.status(400).json({
                error: 'Property ID, local room type, and Channex room type ID are required'
            });
        }

        // Get channel setting ID
        const settingResult = await db.query(
            "SELECT id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Channel settings not found' });
        }

        const channel_setting_id = settingResult.rows[0].id;

        // Check if mapping exists
        const existing = await db.query(
            "SELECT id FROM channel_mappings WHERE channel_setting_id = $1 AND local_room_type = $2",
            [channel_setting_id, local_room_type]
        );

        if (existing.rows.length > 0) {
            // Update existing mapping
            await db.query(
                "UPDATE channel_mappings SET channex_room_type_id = $1, channex_rate_plan_id = $2 WHERE id = $3",
                [channex_room_type_id, channex_rate_plan_id, existing.rows[0].id]
            );
        } else {
            // Create new mapping
            await db.query(
                "INSERT INTO channel_mappings (id, channel_setting_id, local_room_type, channex_room_type_id, channex_rate_plan_id) VALUES ($1, $2, $3, $4, $5)",
                [crypto.randomUUID(), channel_setting_id, local_room_type, channex_room_type_id, channex_rate_plan_id]
            );
        }

        res.json({
            success: true,
            message: 'Room mapping saved successfully'
        });

    } catch (error) {
        console.error('Save MCP Mapping Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/channex/mcp/mappings
// Get room mappings with Channex IDs
router.get('/mcp/mappings', async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        const settingResult = await db.query(
            "SELECT id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0) {
            return res.json({ success: true, mappings: [] });
        }

        const channel_setting_id = settingResult.rows[0].id;

        const mappings = await db.query(
            "SELECT local_room_type, channel_room_id, channex_room_type_id, channex_rate_plan_id FROM channel_mappings WHERE channel_setting_id = $1",
            [channel_setting_id]
        );

        res.json({
            success: true,
            mappings: mappings.rows
        });

    } catch (error) {
        console.error('Get MCP Mappings Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/mcp/ari/prepare
// Prepare ARI data for MCP sync
router.post('/mcp/ari/prepare', async (req, res) => {
    try {
        const { property_id, start_date, end_date, room_types } = req.body;

        if (!property_id || !start_date || !end_date) {
            return res.status(400).json({
                error: 'Property ID, start date, and end date are required'
            });
        }

        // Get Channex property ID
        const settingResult = await db.query(
            "SELECT channex_property_id FROM channel_settings WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        if (settingResult.rows.length === 0 || !settingResult.rows[0].channex_property_id) {
            return res.status(400).json({
                error: 'Property not synced to Channex. Please sync property first.'
            });
        }

        const channex_property_id = settingResult.rows[0].channex_property_id;

        // Get room mappings
        const mappingResult = await db.query(
            `SELECT cm.local_room_type, cm.channex_room_type_id, cm.channex_rate_plan_id 
             FROM channel_mappings cm
             JOIN channel_settings cs ON cm.channel_setting_id = cs.id
             WHERE cs.property_id = $1 AND cs.channel_name = 'channex'`,
            [property_id]
        );

        // Get rates from room_rates table
        const ratesResult = await db.query(
            `SELECT room_type, date, price 
             FROM room_rates 
             WHERE property_id = $1 
             AND date >= $2 
             AND date <= $3
             ORDER BY date`,
            [property_id, start_date, end_date]
        );

        res.json({
            success: true,
            message: 'ARI data ready for MCP sync',
            data: {
                channexPropertyId: channex_property_id,
                startDate: start_date,
                endDate: end_date,
                mappings: mappingResult.rows,
                rates: ratesResult.rows
            },
            requiresMcpSync: true
        });

    } catch (error) {
        console.error('Prepare ARI Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/channex/mcp/sync-complete
// Mark sync as complete
router.post('/mcp/sync-complete', async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'Property ID required' });

        await db.query(
            "UPDATE channel_settings SET last_sync = NOW() WHERE property_id = $1 AND channel_name = 'channex'",
            [property_id]
        );

        res.json({
            success: true,
            message: 'Sync timestamp updated'
        });

    } catch (error) {
        console.error('Sync Complete Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

