const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');

        console.log('🏗️ Adding AI columns to maintenance table...');

        await client.query(`
            ALTER TABLE maintenance 
            ADD COLUMN IF NOT EXISTS category TEXT,
            ADD COLUMN IF NOT EXISTS ai_summary TEXT,
            ADD COLUMN IF NOT EXISTS suggested_action TEXT,
            ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'Medium';
        `);

        console.log('✅ AI columns added successfully.');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

migrate();
