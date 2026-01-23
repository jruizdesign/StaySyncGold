const express = require('express');
const router = express.Router();

const {
  getStaff,
  createStaff,
  clockIn,
  clockOut,
  getClockHistory,
  updateStaff,
  deleteStaff
} = require('../controllers/staff');

router.route('/').get(getStaff).post(createStaff);

router.route('/:id')
  .put(updateStaff)
  .delete(deleteStaff);

router.route('/clock-in').post(clockIn);
router.route('/clock-out').post(clockOut);
router.route('/clock-history').get(getClockHistory);

module.exports = router;
