const express = require('express');
const router = express.Router();

const {
  getProperties,
  createProperty,
  assignUserRole,
} = require('../controllers/admin');

router.route('/properties').get(getProperties).post(createProperty);
router.route('/users/:id/assign-role').put(assignUserRole);

module.exports = router;
