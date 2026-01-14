const db = require('../../config/database');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Public
const getReservations = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM Reservations');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Public
const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM Reservations WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Public
const createReservation = async (req, res, next) => {
  try {
    const { property_id, guest_id, room_id, check_in, check_out, status } = req.body;
    const { rows } = await db.query(
      'INSERT INTO Reservations (property_id, guest_id, room_id, check_in, check_out, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [property_id, guest_id, room_id, check_in, check_out, status]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update a reservation
// @route   PUT /api/reservations/:id
// @access  Public
const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { property_id, guest_id, room_id, check_in, check_out, status } = req.body;
    const { rows } = await db.query(
      'UPDATE Reservations SET property_id = $1, guest_id = $2, room_id = $3, check_in = $4, check_out = $5, status = $6 WHERE id = $7 RETURNING *',
      [property_id, guest_id, room_id, check_in, check_out, status, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a reservation
// @route   DELETE /api/reservations/:id
// @access  Public
const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM Reservations WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
};
