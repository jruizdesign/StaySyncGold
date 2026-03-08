const express = require('express');
const router = express.Router();
const qbController = require('../controllers/quickbooks');
const { protect } = require('../../middleware/auth');

// Public routes for OAuth flow
router.get('/authUri', qbController.getAuthUri);
router.get('/callback', qbController.callback);

// Protected routes for UI interaction
router.get('/status', protect, qbController.getStatus);
router.get('/accounts', protect, qbController.getAccounts);
router.post('/mapping', protect, qbController.saveMapping);
router.post('/sync', protect, qbController.sync);
router.get('/logs', protect, qbController.getLogs);

module.exports = router;
