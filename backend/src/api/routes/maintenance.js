const express = require('express');
const router = express.Router();

const {
  getMaintenanceLogs,
  getMaintenanceLog,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
} = require('../controllers/maintenance');

router.route('/').get(getMaintenanceLogs).post(createMaintenanceLog);
router
  .route('/:id')
  .get(getMaintenanceLog)
  .put(updateMaintenanceLog)
  .delete(deleteMaintenanceLog);

module.exports = router;
