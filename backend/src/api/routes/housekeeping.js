const express = require('express');
const router = express.Router();

const {
  getHousekeepingLogs,
  createHousekeepingLog,
} = require('../controllers/housekeeping');

router.route('/').get(getHousekeepingLogs).post(createHousekeepingLog);

module.exports = router;
