const { createClient } = require('@supabase/supabase-js');
const aiService = require('../../services/aiService');

// Initialize base Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

/**
 * @desc    Get AI-generated insights for a property
 * @route   GET /api/ai/insights/:propertyId
 * @access  Public
 */
const getPropertyInsights = async (req, res) => {
    try {
        const { propertyId } = req.params;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        // Forward user JWT to Supabase client to bypass RLS
        const token = req.headers.authorization?.split(' ')[1];
        const scopedSupabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        apikey: process.env.SUPABASE_ANON_KEY
                    }
                }
            }
        );

        // Fetch property data from Supabase
        const propertyData = await fetchPropertyData(propertyId, scopedSupabase);

        // Generate AI insights
        const insights = await aiService.generatePropertyInsights(propertyData);

        res.status(200).json(insights);
    } catch (error) {
        console.error('Error getting property insights:', error);
        res.status(500).json({
            error: 'Failed to generate insights',
            message: error.message
        });
    }
};

/**
 * Fetch aggregated property data from Supabase using user's scoped client
 */
async function fetchPropertyData(propertyId, client) {
    try {
        const maintenancePromise = client
            .from('maintenance')
            .select('*')
            .eq('property_id', propertyId)
            .neq('status', 'Resolved')
            .order('created_at', { ascending: false })
            .then(res => res.data || [])
            .catch(() => []);

        const today = new Date().toISOString().split('T')[0];
        
        const checkInsPromise = client
            .from('reservations')
            .select('*')
            .eq('property_id', propertyId)
            .eq('check_in', today)
            .then(res => (res.data || []).map(r => ({ ...r, type: 'check_in' })))
            .catch(() => []);

        const checkOutsPromise = client
            .from('reservations')
            .select('*')
            .eq('property_id', propertyId)
            .eq('check_out', today)
            .then(res => (res.data || []).map(r => ({ ...r, type: 'check_out' })))
            .catch(() => []);

        const inHousePromise = client
            .from('reservations')
            .select('*')
            .eq('property_id', propertyId)
            .eq('status', 'Checked In')
            .then(res => (res.data || []).map(r => ({ ...r, type: 'in_house' })))
            .catch(() => []);

        const roomsPromise = client
            .from('rooms')
            .select('status')
            .eq('property_id', propertyId)
            .then(res => {
                const rooms = res.data || [];
                return {
                    total: rooms.length,
                    occupied: rooms.filter(r => r.status === 'Occupied').length,
                    percentage: rooms.length > 0
                        ? Math.round((rooms.filter(r => r.status === 'Occupied').length / rooms.length) * 100)
                        : 0
                };
            })
            .catch(() => ({ total: 0, occupied: 0, percentage: 0 }));

        const staffShiftsPromise = client
            .from('staff_shifts')
            .select('*')
            .eq('property_id', propertyId)
            .is('clock_out', null)
            .then(res => res.data || [])
            .catch(() => []);

        const [
            maintenanceTickets,
            checkIns,
            checkOuts,
            inHouse,
            occupancy,
            staffShifts
        ] = await Promise.all([
            maintenancePromise,
            checkInsPromise,
            checkOutsPromise,
            inHousePromise,
            roomsPromise,
            staffShiftsPromise
        ]);

        const reservations = [...checkIns, ...checkOuts, ...inHouse];

        return {
            maintenanceTickets,
            reservations,
            occupancy,
            staffShifts
        };
    } catch (error) {
        console.error('Error fetching property data:', error);
        return {
            maintenanceTickets: [],
            reservations: [],
            occupancy: { total: 0, occupied: 0, percentage: 0 },
            staffShifts: []
        };
    }
}


/**
 * @desc    Analyze a maintenance issue before submission
 * @route   POST /api/ai/analyze-issue
 * @access  Public (Context: Staff/Guest)
 */
const analyzeIssue = async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const analysis = await aiService.analyzeMaintenanceRequest(description);
        res.status(200).json(analysis);
    } catch (error) {
        console.error('DEBUG: Full AI Error:', error);
        console.error('DEBUG: AI Error Message:', error.message);
        if (error.response) {
            console.error('DEBUG: AI Error Response:', await error.response.text());
        }
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
};

/**
 * @desc    Handle generic AI chat interaction
 * @route   POST /api/ai/chat
 * @access  Public
 */
const answerChat = async (req, res) => {
    try {
        const { prompt, context } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await aiService.generateChatResponse(prompt, context);
        res.status(200).json({ message: response });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Chat failed' });
    }
};

module.exports = {
    getPropertyInsights,
    analyzeIssue,
    answerChat
};
