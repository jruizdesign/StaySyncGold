const db = require('../../config/database');
const bcrypt = require('bcrypt');

// @desc    Get all staff
// @route   GET /api/staff
// @access  Public
const getStaff = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, property_id, role, firstname, last_name, phone_num FROM staff');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a staff member
// @route   POST /api/staff
// @access  Public
const createStaff = async (req, res, next) => {
  try {
    const { property_id, role, firstname, last_name, phone_num, pin } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);
    const { rows } = await db.query(
      'INSERT INTO staff (property_id, role, firstname, last_name, phone_num, pin) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, property_id, role, firstname, last_name, phone_num',
      [property_id, role, firstname, last_name, phone_num, hashedPin]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const findStaffByPin = async (pin, property_id) => {
  // This is not secure, in a real app we would not query all staff pins
  const { rows } = await db.query('SELECT id, pin FROM staff WHERE property_id = $1', [property_id]);

  for (const staff of rows) {
    const isMatch = await bcrypt.compare(pin, staff.pin);
    if (isMatch) {
      return staff;
    }
  }
  return null;
}

// @desc    Staff clock in
// @route   POST /api/staff/clock-in
// @access  Public
const clockIn = async (req, res, next) => {
  try {
    const { pin, property_id } = req.body;

    const staffMember = await findStaffByPin(pin, property_id);

    if (!staffMember) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Log the clock-in event
    await db.query(
      'INSERT INTO staff_clock_events (staff_id, property_id, "type") VALUES ($1, $2, $3)',
      [staffMember.id, property_id, 'in']
    );

    res.status(200).json({ message: 'Clock-in successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Staff clock out
// @route   POST /api/staff/clock-out
// @access  Public
const clockOut = async (req, res, next) => {
  try {
    const { pin, property_id } = req.body;

    const staffMember = await findStaffByPin(pin, property_id);

    if (!staffMember) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Log the clock-out event
    await db.query(
      'INSERT INTO staff_clock_events (staff_id, property_id, "type") VALUES ($1, $2, $3)',
      [staffMember.id, property_id, 'out']
    );

    res.status(200).json({ message: 'Clock-out successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get staff clock history
// @route   GET /api/staff/clock-history
// @access  Private (Owner, Manager) - RBAC will be implemented later
const getClockHistory = async (req, res, next) => {
  try {
    // Assuming property_id is passed in the request, e.g., from a middleware
    const { property_id, staff_id } = req.query; // Or req.user.property_id after auth
    if (!property_id) {
      return res.status(400).json({ message: 'Property ID is required' });
    }

    const { rows } = await db.query(
      `SELECT
        sce.id,
        sce.staff_id,
        s.firstname,
        s.last_name,
        sce.type,
        sce.timestamp
      FROM staff_clock_events sce
      JOIN staff s ON sce.staff_id = s.id
      WHERE sce.property_id = $1
      ${staff_id ? 'AND sce.staff_id = $2' : ''}
      ORDER BY sce.timestamp DESC`,
      staff_id ? [property_id, staff_id] : [property_id]
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// @desc    Update a staff member
// @route   PUT /api/staff/:id
// @access  Public (should be protected)
const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { property_id, role, firstname, last_name, phone_num, pin } = req.body;

    // Hash PIN if it's being updated
    let hashedPin;
    if (pin) {
      const salt = await bcrypt.genSalt(10);
      hashedPin = await bcrypt.hash(pin, salt);
    }

    // Build the query dynamically
    let query = 'UPDATE staff SET role = $1, firstname = $2, last_name = $3, phone_num = $4';
    let params = [role, firstname, last_name, phone_num];
    let paramIndex = 5;

    if (hashedPin) {
      query += `, pin = $${paramIndex}`;
      params.push(hashedPin);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Public (should be protected)
const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM staff WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.status(200).json({ message: 'Staff member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  clockIn,
  clockOut,
  getClockHistory,
};