const express = require('express');
const router = express.Router();

const {
  getFinancialReport,
  getDailyRoomCosts,
} = require('../controllers/reports');

router.route('/financial').get(getFinancialReport);
router.route('/daily-room-costs').get(getDailyRoomCosts);

module.exports = router;
