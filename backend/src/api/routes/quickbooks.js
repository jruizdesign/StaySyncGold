const express = require('express');
const router = express.Router();
const qbController = require('../controllers/quickbooks');

// All routes are protected by auth middleware in index.js

router.get('/status', qbController.getStatus);
router.post('/connect', qbController.connect);
router.get('/accounts', qbController.getAccounts);
router.post('/mapping', qbController.saveMapping);
router.post('/sync', qbController.sync);
router.get('/logs', qbController.getLogs);

module.exports = router;
