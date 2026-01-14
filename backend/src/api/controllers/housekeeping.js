const db = require('../../config/database');

// @desc    Get all housekeeping logs
// @route   GET /api/housekeeping
// @access  Public
const getHousekeepingLogs = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM HousekeepingLog');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a housekeeping log
// @route   POST /api/housekeeping
// @access  Public
const createHousekeepingLog = async (req, res, next) => {
  try {
    const { property_id, room_id, staff_id, status_from, status_to } = req.body;
    const { rows } = await db.query(
      'INSERT INTO HousekeepingLog (property_id, room_id, staff_id, status_from, status_to) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [property_id, room_id, staff_id, status_from, status_to]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getHousekeepingLogs,
  createHousekeepingLog,
};
