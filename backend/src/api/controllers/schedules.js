const db = require('../../config/database');

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Public
const getSchedules = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM staff_schedules');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single schedule
// @route   GET /api/schedules/:id
// @access  Public
const getScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM staff_schedules WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a schedule
// @route   POST /api/schedules
// @access  Public
const createSchedule = async (req, res, next) => {
  try {
    const { property_id, staff_id, shift_date, start_time, end_time, notes } = req.body;
    const { rows } = await db.query(
      'INSERT INTO staff_schedules (property_id, staff_id, shift_date, start_time, end_time, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [property_id, staff_id, shift_date, start_time, end_time, notes]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update a schedule
// @route   PUT /api/schedules/:id
// @access  Public
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { property_id, staff_id, shift_date, start_time, end_time, notes } = req.body;
    const { rows } = await db.query(
      'UPDATE staff_schedules SET property_id = $1, staff_id = $2, shift_date = $3, start_time = $4, end_time = $5, notes = $6 WHERE id = $7 RETURNING *',
      [property_id, staff_id, shift_date, start_time, end_time, notes, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Public
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM staff_schedules WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
