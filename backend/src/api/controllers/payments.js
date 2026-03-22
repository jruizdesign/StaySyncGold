const db = require('../../config/database');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback';
const stripe = require('stripe')(stripeSecretKey);

// @desc    Get all payments for a property
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const { property_id } = req.query;
    if (!property_id) {
      return res.status(400).json({ message: 'property_id is required' });
    }
    const { rows } = await db.query('SELECT * FROM payments WHERE property_id = $1 ORDER BY created_at DESC', [property_id]);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a Stripe PaymentIntent
// @route   POST /api/payments/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res, next) => {
  try {
    const { property_id, res_id, amount, currency = 'usd' } = req.body;

    if (!property_id || !amount) {
      return res.status(400).json({ message: 'property_id and amount are required' });
    }

    // Stripe expects amount in cents
    const amountInCents = Math.round(amount * 100);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        property_id: property_id,
        res_id: res_id || null,
      }
    });

    // Create a pending record in our database
    await db.query(`
      INSERT INTO payments (property_id, res_id, amount, currency, status, stripe_payment_intent_id, method) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [property_id, res_id || null, amount, currency, 'pending', paymentIntent.id, 'card']);

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Record a manual payment (Cash, Check, etc.)
// @route   POST /api/payments/manual
// @access  Private
const recordManualPayment = async (req, res, next) => {
  try {
    const { property_id, res_id, amount, method, notes, currency = 'usd' } = req.body;

    if (!property_id || !amount || !method) {
      return res.status(400).json({ message: 'property_id, amount, and method are required' });
    }

    // Insert payment directly as succeeded
    const { rows } = await db.query(`
      INSERT INTO payments (property_id, res_id, amount, currency, status, method, notes) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [property_id, res_id || null, amount, currency, 'succeeded', method, notes]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error recording manual payment:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPaymentIntent,
  recordManualPayment,
};
