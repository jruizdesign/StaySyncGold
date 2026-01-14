const express = require('express');
const router = express.Router();

const {
  getPayments,
  getPaymentById,
  createPayment,
} = require('../controllers/payments');

router.route('/').get(getPayments).post(createPayment);
router.route('/:id').get(getPaymentById);

module.exports = router;
