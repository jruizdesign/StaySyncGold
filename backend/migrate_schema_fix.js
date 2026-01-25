require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
    user: 'postgres.hpgzwebgfjdwpaqwwoub',
    host: 'aws-0-us-west-2.pooler.supabase.com',
    database: 'postgres',
    password: 'RuizJ9199!!??',
    port: 6543,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Fixing financial_transactions schema...');

        await client.query('BEGIN');

        // 1. Make reservation_id nullable (Expenses don't always have reservations)
        console.log('🛠 Altering reservation_id to be NULLABLE...');
        await client.query('ALTER TABLE financial_transactions ALTER COLUMN reservation_id DROP NOT NULL;');

        // 2. Add status column if missing
        console.log('🛠 Adding status column if missing...');
        await client.query("ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Completed';");

        // 3. Convert type/category to TEXT to avoid ENUM strictness for now (simplifies future changes)
        // OR add 'Maintenance' to category enum if it exists.
        // Let's check if they are enums.
        console.log('🛠 Converting type/category to TEXT to avoid strict ENUM issues...');
        await client.query('ALTER TABLE financial_transactions ALTER COLUMN type TYPE TEXT;');
        await client.query('ALTER TABLE financial_transactions ALTER COLUMN category TYPE TEXT;');

        await client.query('COMMIT');
        console.log('🎉 Schema Fixed!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
