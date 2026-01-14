const express = require('express');
const router = express.Router();

const {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} = require('../controllers/reservations');

router.route('/').get(getReservations).post(createReservation);
router.route('/:id').get(getReservationById).put(updateReservation).delete(deleteReservation);

module.exports = router;
