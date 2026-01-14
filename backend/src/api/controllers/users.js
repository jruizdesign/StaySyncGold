const db = require('../../config/database');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin) - RBAC will be implemented later
const getUsers = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, property_id, role, isAdmin, isStaff, isOwner, isManager, email, first_name, last_name FROM Users');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsers,
};
