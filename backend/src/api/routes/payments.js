const express = require('express');
const router = express.Router();

const {
  getPayments,
  getPaymentById,
  createPaymentIntent,
} = require('../controllers/payments');

// Protect these routes to ensure auth.uid() is available
router.route('/').get(getPayments);
router.route('/:id').get(getPaymentById);
router.post('/create-payment-intent', createPaymentIntent);

module.exports = router;
