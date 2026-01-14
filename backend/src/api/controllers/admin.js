const db = require('../../config/database');
const bcrypt = require('bcrypt'); // Potentially used for user creation with password

// @desc    Get all properties
// @route   GET /api/admin/properties
// @access  Private (Admin)
const getProperties = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM Properties');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new property
// @route   POST /api/admin/properties
// @access  Private (Admin)
const createProperty = async (req, res, next) => {
  try {
    const { location, managerName, ownerName, phone_num } = req.body;
    const { rows } = await db.query(
      'INSERT INTO Properties (location, managerName, ownerName, phone_num) VALUES ($1, $2, $3, $4) RETURNING *',
      [location, managerName, ownerName, phone_num]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Assign a role to a user
// @route   PUT /api/admin/users/:id/assign-role
// @access  Private (Admin)
const assignUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, property_id } = req.body; // role can be 'isStaff', 'isManager', 'isOwner', 'isAdmin'

    // First, clear existing roles for the user on this property (or all properties if property_id is null)
    let updateQuery = 'UPDATE Users SET isStaff = FALSE, isManager = FALSE, isOwner = FALSE, isAdmin = FALSE';
    let queryParams = [];

    if (property_id) {
        updateQuery += ' WHERE id = $1 AND property_id = $2';
        queryParams.push(id, property_id);
    } else {
        updateQuery += ' WHERE id = $1';
        queryParams.push(id);
    }
    await db.query(updateQuery, queryParams);


    // Then, set the new role
    let setRoleQuery = `UPDATE Users SET ${role} = TRUE`;
    let setRoleParams = [];

    if (property_id) {
        setRoleQuery += ' WHERE id = $1 AND property_id = $2 RETURNING *';
        setRoleParams.push(id, property_id);
    } else {
        setRoleQuery += ' WHERE id = $1 RETURNING *';
        setRoleParams.push(id);
    }

    const { rows } = await db.query(setRoleQuery, setRoleParams);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User or property not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getProperties,
  createProperty,
  assignUserRole,
};
