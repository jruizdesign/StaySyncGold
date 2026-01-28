const express = require('express');
const router = express.Router();

const {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  addCharge,
} = require('../controllers/reservations');

router.route('/').get(getReservations).post(createReservation);
router.route('/:id').get(getReservationById).put(updateReservation).delete(deleteReservation);
router.route('/:id/charges').post(addCharge);

module.exports = router;
