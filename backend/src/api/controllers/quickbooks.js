const db = require('../../config/database');
const qbMockService = require('../../services/quickbooksMockService');

// @desc    Get QuickBooks Connection Status & Settings
// @route   GET /api/quickbooks/status
const getStatus = async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'property_id required' });

        const { rows } = await db.query('SELECT * FROM quickbooks_settings WHERE property_id = $1', [property_id]);

        if (rows.length === 0) {
            return res.json({ is_connected: false });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Simulate Connecting to QuickBooks
// @route   POST /api/quickbooks/connect
const connect = async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'property_id required' });

        // Simulate OAuth
        const tokens = await qbMockService.connect();

        // Upsert settings
        const { rows } = await db.query(`
      INSERT INTO quickbooks_settings (property_id, is_connected)
      VALUES ($1, true)
      ON CONFLICT (property_id) DO UPDATE SET is_connected = true, updated_at = NOW()
      RETURNING *
    `, [property_id]);

        res.json({ success: true, settings: rows[0], mock_tokens: tokens });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Chart of Accounts for mapping
// @route   GET /api/quickbooks/accounts
const getAccounts = async (req, res) => {
    try {
        const accounts = await qbMockService.getChartOfAccounts();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Save Account Mappings
// @route   POST /api/quickbooks/mapping
const saveMapping = async (req, res) => {
    try {
        const { property_id, room_revenue_account_id, tax_account_id, bank_account_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'property_id required' });

        const { rows } = await db.query(`
      UPDATE quickbooks_settings
      SET room_revenue_account_id = $1, tax_account_id = $2, bank_account_id = $3, updated_at = NOW()
      WHERE property_id = $4
      RETURNING *
    `, [room_revenue_account_id, tax_account_id, bank_account_id, property_id]);

        res.json({ success: true, settings: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Sync all pending completed payments to QB
// @route   POST /api/quickbooks/sync
const sync = async (req, res) => {
    try {
        const { property_id } = req.body;
        if (!property_id) return res.status(400).json({ error: 'property_id required' });

        // Get settings
        const settingsRes = await db.query('SELECT * FROM quickbooks_settings WHERE property_id = $1', [property_id]);
        if (settingsRes.rows.length === 0 || !settingsRes.rows[0].is_connected) {
            return res.status(400).json({ error: 'QuickBooks is not connected.' });
        }
        const settings = settingsRes.rows[0];

        // Get unsynced payments
        const paymentsRes = await db.query(`
      SELECT * FROM payments 
      WHERE property_id = $1 AND status = 'succeeded' AND is_qb_synced = false
    `, [property_id]);

        const payments = paymentsRes.rows;
        const results = [];

        // Process each payment
        for (const payment of payments) {
            try {
                const syncResult = await qbMockService.syncPayment(payment, settings);

                // Log success
                await db.query(`
          INSERT INTO quickbooks_sync_logs (property_id, payment_id, qb_transaction_id, status)
          VALUES ($1, $2, $3, 'success')
        `, [property_id, payment.id, syncResult.qb_transaction_id]);

                // Mark as synced
                await db.query(`
          UPDATE payments SET is_qb_synced = true WHERE id = $1
        `, [payment.id]);

                results.push({ payment_id: payment.id, status: 'success' });
            } catch (err) {
                // Log failure
                await db.query(`
          INSERT INTO quickbooks_sync_logs (property_id, payment_id, status, error_message)
          VALUES ($1, $2, 'failed', $3)
        `, [property_id, payment.id, err.message]);

                results.push({ payment_id: payment.id, status: 'failed', error: err.message });
            }
        }

        res.json({ success: true, synced_count: payments.length, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get sync logs
// @route   GET /api/quickbooks/logs
const getLogs = async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'property_id required' });

        const { rows } = await db.query(`
      SELECT l.*, p.amount, p.created_at as payment_date
      FROM quickbooks_sync_logs l
      JOIN payments p ON l.payment_id = p.id
      WHERE l.property_id = $1
      ORDER BY l.created_at DESC
      LIMIT 50
    `, [property_id]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStatus,
    connect,
    getAccounts,
    saveMapping,
    sync,
    getLogs
};
