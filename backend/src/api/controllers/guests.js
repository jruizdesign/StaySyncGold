const db = require('../../config/database');

// @desc    Get all guests
// @route   GET /api/guests
// @access  Public
const getGuests = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM Guests');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single guest
// @route   GET /api/guests/:id
// @access  Public
const getGuestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM Guests WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a guest
// @route   POST /api/guests
// @access  Public
const createGuest = async (req, res, next) => {
  try {
    const { property_id, first_name, last_name, email, phone, passport_no } = req.body;
    const { rows } = await db.query(
      'INSERT INTO Guests (property_id, first_name, last_name, email, phone, passport_no) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [property_id, first_name, last_name, email, phone, passport_no]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update a guest
// @route   PUT /api/guests/:id
// @access  Public
const updateGuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { property_id, first_name, last_name, email, phone, passport_no } = req.body;
    const { rows } = await db.query(
      'UPDATE Guests SET property_id = $1, first_name = $2, last_name = $3, email = $4, phone = $5, passport_no = $6 WHERE id = $7 RETURNING *',
      [property_id, first_name, last_name, email, phone, passport_no, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a guest
// @route   DELETE /api/guests/:id
// @access  Public
const deleteGuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM Guests WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
};
