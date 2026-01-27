const express = require('express');
const router = express.Router();
const rateService = require('../services/rateService');
const validateRateAccess = require('../middleware/validateRateAccess');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware to get Property ID (if not in req.user)
const ensurePropertyId = (req, res, next) => {
    // Assuming auth middleware puts user in req.user
    // If propertyId not on user, might need to fetch it or pass in query
    // req.user from 'auth.js' typically has propertyId
    if (!req.user?.propertyId) {
        return res.status(400).json({ error: "Property ID missing from session" });
    }
    next();
};

// GET /dynamic - Fetch rates (Public/Internal - No Role check needed for viewing usually, only editing? 
// User said "Front Desk users should only see the calculated final price". So GET is open to auth users.)
router.get('/dynamic', ensurePropertyId, async (req, res) => {
    try {
        const { startDate, endDate, ratePlanId } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ error: "Dates required" });

        const rates = await rateService.getRates(startDate, endDate, req.user.propertyId, ratePlanId);
        res.json(rates);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /dynamic - Update rate (Protected by RBAC)
router.post('/dynamic', ensurePropertyId, validateRateAccess, async (req, res) => {
    try {
        const { roomTypeId, date, price, ratePlanId } = req.body;
        // Validation...
        await rateService.updateRate(req.user.propertyId, roomTypeId, date, price, ratePlanId);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /toggle - Toggle Dynamic Pricing Feature (Admin/Manager)
router.post('/toggle', ensurePropertyId, validateRateAccess, async (req, res) => {
    try {
        const { enabled } = req.body;
        const result = await rateService.toggleDynamicPricing(req.user.propertyId, enabled);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
    // POST /apply-rule - Apply derivation rule to rate plan
    router.post('/apply-rule', ensurePropertyId, validateRateAccess, async (req, res) => {
        try {
            const { ratePlanId, rule } = req.body;
            const result = await rateService.applyDerivationRule(req.user.propertyId, ratePlanId, rule);
            res.json(result);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    // GET /settings - Get Toggle Status
    router.get('/settings', ensurePropertyId, async (req, res) => {
        try {
            const { data } = await supabase
                .from('organization_settings')
                .select('enable_dynamic_pricing')
                .eq('property_id', req.user.propertyId)
                .single();

            res.json({ enabled: data?.enable_dynamic_pricing || false });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });


    module.exports = router;
