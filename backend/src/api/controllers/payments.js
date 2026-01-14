const db = require('../../config/database');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Public
const getPayments = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM Payments');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Public
const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM Payments WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a payment
// @route   POST /api/payments
// @access  Public
const createPayment = async (req, res, next) => {
  try {
    const { property_id, res_id, amount, method, status, token } = req.body;
    const { rows } = await db.query(
      'INSERT INTO Payments (property_id, res_id, amount, method, status, token) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [property_id, res_id, amount, method, status, token]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
};
