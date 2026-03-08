const db = require('../../config/database');
const qboService = require('../../services/quickbooksService');

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

        const settings = rows[0];
        // Check if token is valid (this is a simple implementation, ideally we'd try to refresh an expired token)
        const isConnected = !!settings.access_token && !!settings.realm_id;

        res.json({
            ...settings,
            is_connected: isConnected
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get OAuth URL to start connection
// @route   GET /api/quickbooks/authUri
const getAuthUri = async (req, res) => {
    try {
        const authUri = qboService.getAuthUri();
        res.json({ authUri });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Handle OAuth callback
// @route   GET /api/quickbooks/callback
const callback = async (req, res) => {
    try {
        // Intuit sends code, state, and realmId in the query params
        const url = req.protocol + '://' + req.get('host') + req.originalUrl;

        // Use a default property ID for now (in a real app, you'd pass this in `state` or read from session)
        // Here we just grab the first property for simplicity, or expect it in state
        const propertyRes = await db.query('SELECT id FROM properties LIMIT 1');
        const property_id = propertyRes.rows[0].id;

        const tokenData = await qboService.createToken(url);

        const accessToken = tokenData.token.access_token;
        const refreshToken = tokenData.token.refresh_token;
        const realmId = tokenData.realmId;
        // Simple expiration logic
        const expiresAt = new Date(Date.now() + (tokenData.token.expires_in * 1000));

        await db.query(`
            INSERT INTO quickbooks_settings (property_id, is_connected, access_token, refresh_token, realm_id, token_expires_at)
            VALUES ($1, true, $2, $3, $4, $5)
            ON CONFLICT (property_id) 
            DO UPDATE SET 
                is_connected = true, 
                access_token = $2, 
                refresh_token = $3, 
                realm_id = $4, 
                token_expires_at = $5,
                updated_at = NOW()
        `, [property_id, accessToken, refreshToken, realmId, expiresAt]);

        // Redirect back to frontend
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/quickbooks-integration`);
    } catch (error) {
        console.error("QBO Callback Error:", error);
        res.status(500).send("Error connecting to QuickBooks. Please try again.");
    }
};

// @desc    Get Chart of Accounts for mapping
// @route   GET /api/quickbooks/accounts
const getAccounts = async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: 'property_id required' });

        const { rows } = await db.query('SELECT * FROM quickbooks_settings WHERE property_id = $1', [property_id]);
        if (rows.length === 0 || !rows[0].access_token) {
            return res.status(400).json({ error: 'Not connected to QuickBooks' });
        }

        const tokenData = {
            access_token: rows[0].access_token,
            refresh_token: rows[0].refresh_token
        };

        const accounts = await qboService.getAccounts(tokenData, rows[0].realm_id);
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
        if (settingsRes.rows.length === 0 || !settingsRes.rows[0].access_token) {
            return res.status(400).json({ error: 'QuickBooks is not connected.' });
        }
        const settings = settingsRes.rows[0];

        if (!settings.room_revenue_account_id || !settings.bank_account_id) {
            return res.status(400).json({ error: 'QuickBooks accounts must be mapped before syncing.' });
        }

        const tokenData = {
            access_token: settings.access_token,
            refresh_token: settings.refresh_token
        };

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
                // Pass mapping configuration to the sync function
                const qbTransactionId = await qboService.syncPayment(tokenData, settings.realm_id, payment, {
                    income_account_id: settings.room_revenue_account_id,
                    deposit_account_id: settings.bank_account_id
                });

                // Log success
                await db.query(`
          INSERT INTO quickbooks_sync_logs (property_id, payment_id, qb_transaction_id, status)
          VALUES ($1, $2, $3, 'success')
        `, [property_id, payment.id, qbTransactionId]);

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
    getAuthUri,
    callback,
    getAccounts,
    saveMapping,
    sync,
    getLogs
};
