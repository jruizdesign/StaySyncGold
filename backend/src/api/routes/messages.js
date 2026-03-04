const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messages');
const { protect } = require('../../middleware/auth');

// Protect all message routes
router.use(protect);

router.post('/send', sendMessage);
router.get('/:reservation_id', getMessages);

module.exports = router;
