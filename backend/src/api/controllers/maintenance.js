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
    const { property_id, room_id, status, description, priority, category, expenses, total_cost } = req.body;

    const { rows } = await db.query(
      `INSERT INTO Maintenance (
        property_id, room_id, status, description, priority, category, expenses, total_cost, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [
        property_id,
        room_id,
        status || 'Open',
        description,
        priority || 'Medium',
        category || 'General',
        JSON.stringify(expenses || []),
        total_cost || 0
      ]
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
    const { property_id, room_id, status, resolution_notes, expenses, total_cost } = req.body;

    // Build the update query dynamically or just update all relevant fields
    // Assuming we want to update everything passed
    const query = `
      UPDATE Maintenance 
      SET 
        status = COALESCE($1, status),
        resolution_notes = COALESCE($2, resolution_notes),
        expenses = COALESCE($3, expenses),
        total_cost = COALESCE($4, total_cost)
      WHERE id = $5 
      RETURNING *
    `;

    const values = [
      status,
      resolution_notes,
      expenses ? JSON.stringify(expenses) : null,
      total_cost,
      id
    ];

    const { rows } = await db.query(query, values);

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

