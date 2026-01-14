const db = require('../../config/database');

// @desc    Get all maintenance logs
// @route   GET /api/maintenance
// @access  Public
const getMaintenanceLogs = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM Maintenance');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get a single maintenance log
// @route   GET /api/maintenance/:id
// @access  Public
const getMaintenanceLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM Maintenance WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Maintenance log not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a maintenance log
// @route   POST /api/maintenance
// @access  Public
const createMaintenanceLog = async (req, res, next) => {
  try {
    const { property_id, room_id, status } = req.body;
    const { rows } = await db.query(
      'INSERT INTO Maintenance (property_id, room_id, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [property_id, room_id, status]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update a maintenance log
// @route   PUT /api/maintenance/:id
// @access  Public
const updateMaintenanceLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { property_id, room_id, status } = req.body;
    const { rows } = await db.query(
      'UPDATE Maintenance SET property_id = $1, room_id = $2, status = $3 WHERE id = $4 RETURNING *',
      [property_id, room_id, status, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Maintenance log not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a maintenance log
// @route   DELETE /api/maintenance/:id
// @access  Public
const deleteMaintenanceLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM Maintenance WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Maintenance log not found' });
    }
    res.status(200).json({ message: 'Maintenance log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMaintenanceLogs,
  getMaintenanceLog,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
};

