const express = require('express');
const router = express.Router();
const { getPropertyInsights } = require('../controllers/ai');

// @route   GET /api/ai/insights/:propertyId
// @desc    Get AI-generated insights for a property
// @access  Public
router.get('/insights/:propertyId', getPropertyInsights);

module.exports = router;
