const express = require('express');
const router = express.Router();
const { getPropertyInsights, analyzeIssue } = require('../controllers/ai');

// @route   GET /api/ai/insights/:propertyId
// @desc    Get AI-generated insights for a property
// @access  Public
router.get('/insights/:propertyId', getPropertyInsights);

// @route   POST /api/ai/analyze-issue
// @desc    Analyze a maintenance issue
// @access  Public
router.post('/analyze-issue', analyzeIssue);

// @route   POST /api/ai/chat
// @desc    Generic AI chat
// @access  Public
router.post('/chat', require('../controllers/ai').answerChat);

module.exports = router;
