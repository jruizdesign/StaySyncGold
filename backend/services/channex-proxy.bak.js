/**
 * Channex Proxy Service
 * 
 * This service acts as a secure proxy between the frontend and Channex MCP server.
 * It handles API key management and provides REST endpoints for Channex operations.
 * 
 * Note: This implementation assumes Channex MCP tools are available via the AI agent.
 * For production, you may want to implement direct Channex API calls or use a dedicated MCP client.
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get Channex API key for a property
 */
async function getChannexApiKey(propertyId) {
    const { data, error } = await supabase
        .from('channel_settings')
        .select('api_key, channex_property_id')
        .eq('property_id', propertyId)
        .eq('channel_name', 'channex')
        .single();

    if (error) {
        throw new Error(`Failed to get Channex API key: ${error.message}`);
    }

    if (!data || !data.api_key) {
        throw new Error('Channex API key not configured for this property');
    }

    return data;
}

/**
 * Save Channex property ID after sync
 */
async function saveChannexPropertyId(propertyId, channexPropertyId) {
    const { error } = await supabase
        .from('channel_settings')
        .update({
            channex_property_id: channexPropertyId,
            last_sync: new Date().toISOString()
        })
        .eq('property_id', propertyId)
        .eq('channel_name', 'channex');

    if (error) {
        throw new Error(`Failed to save Channex property ID: ${error.message}`);
    }
}

/**
 * Save room type mapping
 */
async function saveRoomMapping(channelSettingId, localRoomType, channexRoomTypeId, channexRatePlanId) {
    // Check if mapping exists
    const { data: existing } = await supabase
        .from('channel_mappings')
        .select('id')
        .eq('channel_setting_id', channelSettingId)
        .eq('local_room_type', localRoomType)
        .single();

    if (existing) {
        // Update existing mapping
        const { error } = await supabase
            .from('channel_mappings')
            .update({
                channex_room_type_id: channexRoomTypeId,
                channex_rate_plan_id: channexRatePlanId
            })
            .eq('id', existing.id);

        if (error) throw new Error(`Failed to update room mapping: ${error.message}`);
    } else {
        // Create new mapping
        const { error } = await supabase
            .from('channel_mappings')
            .insert({
                channel_setting_id: channelSettingId,
                local_room_type: localRoomType,
                channex_room_type_id: channexRoomTypeId,
                channex_rate_plan_id: channexRatePlanId
            });

        if (error) throw new Error(`Failed to create room mapping: ${error.message}`);
    }
}

/**
 * Get room mappings for a property
 */
async function getRoomMappings(propertyId) {
    // First get the channel setting ID
    const { data: channelSetting } = await supabase
        .from('channel_settings')
        .select('id')
        .eq('property_id', propertyId)
        .eq('channel_name', 'channex')
        .single();

    if (!channelSetting) {
        return [];
    }

    const { data, error } = await supabase
        .from('channel_mappings')
        .select('*')
        .eq('channel_setting_id', channelSetting.id);

    if (error) {
        throw new Error(`Failed to get room mappings: ${error.message}`);
    }

    return data || [];
}

/**
 * Update last sync timestamp
 */
async function updateLastSync(propertyId) {
    const { error } = await supabase
        .from('channel_settings')
        .update({ last_sync: new Date().toISOString() })
        .eq('property_id', propertyId)
        .eq('channel_name', 'channex');

    if (error) {
        console.error('Failed to update last sync:', error);
    }
}

/**
 * Get local room types for a property
 */
async function getLocalRoomTypes(propertyId) {
    const { data, error } = await supabase
        .from('rooms')
        .select('type')
        .eq('property_id', propertyId);

    if (error) {
        throw new Error(`Failed to get room types: ${error.message}`);
    }

    // Get unique room types
    const uniqueTypes = [...new Set(data.map(room => room.type))];
    return uniqueTypes;
}

/**
 * Get property details for Channex sync
 */
async function getPropertyDetails(propertyId) {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

    if (error) {
        throw new Error(`Failed to get property details: ${error.message}`);
    }

    return data;
}

module.exports = {
    getChannexApiKey,
    saveChannexPropertyId,
    saveRoomMapping,
    getRoomMappings,
    updateLastSync,
    getLocalRoomTypes,
    getPropertyDetails
};
