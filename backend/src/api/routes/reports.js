const express = require('express');
const router = express.Router();

const {
  getFinancialReport,
  getDailyRoomCosts,
  getBookingLedger,
  getDashboardStats,
} = require('../controllers/reports');

router.route('/financial').get(getFinancialReport);
router.route('/daily-room-costs').get(getDailyRoomCosts);
router.route('/ledger').get(getBookingLedger);
router.route('/dashboard-stats').get(getDashboardStats);

module.exports = router;
