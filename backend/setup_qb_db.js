const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/jason/Dev/StaySyncGold/backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setup() {
  try {
    // 1. Create quickbooks_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quickbooks_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        is_connected BOOLEAN DEFAULT false,
        room_revenue_account_id VARCHAR(255),
        tax_account_id VARCHAR(255),
        bank_account_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(property_id)
      );
    `);
    console.log('quickbooks_settings table created or exists.');

    // 2. Add is_qb_synced to payments
    await pool.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS is_qb_synced BOOLEAN DEFAULT false;
    `);
    console.log('Added is_qb_synced column to payments.');

    // 3. Create quickbooks_sync_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quickbooks_sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
        qb_transaction_id VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('quickbooks_sync_logs table created or exists.');

    console.log('Database setup complete.');
  } catch (err) {
    console.error('Error setting up DB:', err);
  } finally {
    pool.end();
  }
}

setup();
