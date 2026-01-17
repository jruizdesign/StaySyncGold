const express = require('express');
const router = express.Router();

const {
  getFinancialReport,
  getDailyRoomCosts,
  getBookingLedger,
} = require('../controllers/reports');

router.route('/financial').get(getFinancialReport);
router.route('/daily-room-costs').get(getDailyRoomCosts);
router.route('/ledger').get(getBookingLedger);

module.exports = router;
