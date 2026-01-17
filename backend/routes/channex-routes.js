/**
 * Channex API Routes
 * 
 * Express routes for Channex integration operations.
 * These endpoints act as a proxy to MCP tools and manage database state.
 */

const express = require('express');
const router = express.Router();
const channexProxy = require('../services/channex-proxy');

/**
 * POST /api/channex/property/sync
 * Sync property to Channex
 * 
 * This endpoint will be called by the AI agent with MCP tools.
 * The frontend triggers this, and the agent handles the actual MCP calls.
 */
router.post('/property/sync', async (req, res) => {
    try {
        const { propertyId } = req.body;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        // Get property details
        const property = await channexProxy.getPropertyDetails(propertyId);

        // Get API key
        const { api_key } = await channexProxy.getChannexApiKey(propertyId);

        // Return property data for MCP sync
        // The actual MCP call will be made by the AI agent
        res.json({
            success: true,
            message: 'Property data ready for sync',
            property: {
                id: property.id,
                name: property.name || property.location,
                address: property.location,
                // Add other relevant property fields
            },
            requiresMcpSync: true
        });

    } catch (error) {
        console.error('Property sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/channex/property/save-id
 * Save Channex property ID after successful sync
 */
router.post('/property/save-id', async (req, res) => {
    try {
        const { propertyId, channexPropertyId } = req.body;

        if (!propertyId || !channexPropertyId) {
            return res.status(400).json({ error: 'Property ID and Channex Property ID are required' });
        }

        await channexProxy.saveChannexPropertyId(propertyId, channexPropertyId);

        res.json({
            success: true,
            message: 'Channex property ID saved successfully'
        });

    } catch (error) {
        console.error('Save property ID error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/channex/room-types
 * Get local room types for mapping
 */
router.get('/room-types', async (req, res) => {
    try {
        const { propertyId } = req.query;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        const roomTypes = await channexProxy.getLocalRoomTypes(propertyId);

        res.json({
            success: true,
            roomTypes
        });

    } catch (error) {
        console.error('Get room types error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/channex/mappings
 * Get room type mappings
 */
router.get('/mappings', async (req, res) => {
    try {
        const { propertyId } = req.query;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        const mappings = await channexProxy.getRoomMappings(propertyId);

        res.json({
            success: true,
            mappings
        });

    } catch (error) {
        console.error('Get mappings error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/channex/mappings
 * Save room type mapping
 */
router.post('/mappings', async (req, res) => {
    try {
        const { channelSettingId, localRoomType, channexRoomTypeId, channexRatePlanId } = req.body;

        if (!channelSettingId || !localRoomType || !channexRoomTypeId) {
            return res.status(400).json({
                error: 'Channel setting ID, local room type, and Channex room type ID are required'
            });
        }

        await channexProxy.saveRoomMapping(
            channelSettingId,
            localRoomType,
            channexRoomTypeId,
            channexRatePlanId
        );

        res.json({
            success: true,
            message: 'Room mapping saved successfully'
        });

    } catch (error) {
        console.error('Save mapping error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/channex/ari/update
 * Trigger ARI (Availability, Rates, Inventory) update
 * 
 * This endpoint prepares data for MCP sync.
 * The actual MCP call will be made by the AI agent.
 */
router.post('/ari/update', async (req, res) => {
    try {
        const { propertyId, startDate, endDate, roomTypes } = req.body;

        if (!propertyId || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Property ID, start date, and end date are required'
            });
        }

        // Get API key
        const { api_key, channex_property_id } = await channexProxy.getChannexApiKey(propertyId);

        if (!channex_property_id) {
            return res.status(400).json({
                error: 'Property not synced to Channex. Please sync property first.'
            });
        }

        // Get room mappings
        const mappings = await channexProxy.getRoomMappings(propertyId);

        // Return data for MCP sync
        res.json({
            success: true,
            message: 'ARI data ready for sync',
            data: {
                channexPropertyId: channex_property_id,
                startDate,
                endDate,
                roomTypes: roomTypes || mappings.map(m => m.local_room_type),
                mappings
            },
            requiresMcpSync: true
        });

    } catch (error) {
        console.error('ARI update error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/channex/sync-complete
 * Mark sync as complete (update last_sync timestamp)
 */
router.post('/sync-complete', async (req, res) => {
    try {
        const { propertyId } = req.body;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        await channexProxy.updateLastSync(propertyId);

        res.json({
            success: true,
            message: 'Sync timestamp updated'
        });

    } catch (error) {
        console.error('Sync complete error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
