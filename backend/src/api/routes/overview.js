const express = require('express');
const router = express.Router();
const { getDailyOverview } = require('../controllers/daily_overview');

router.get('/daily-overview', getDailyOverview);

module.exports = router;
