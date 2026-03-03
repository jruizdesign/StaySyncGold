const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/stripeWebhook');

// The request body must be raw buffer for Stripe signature verification
router.post('/', handleStripeWebhook);

module.exports = router;
