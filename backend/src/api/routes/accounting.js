const express = require('express');
const router = express.Router();
const {
    getAccountingOverview,
    getDailyFinancials,
    getLedger
} = require('../controllers/accounting');

router.get('/overview', getAccountingOverview);
router.get('/daily', getDailyFinancials);
router.get('/ledger', getLedger);

module.exports = router;
