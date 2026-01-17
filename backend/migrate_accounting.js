require('dotenv').config();
const { Pool } = require('pg');

// Explicit config that works
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
    try {
        console.log('Starting migration: Add settings column to properties...');

        // Check if column exists
        const check = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'settings'"
        );

        if (check.rows.length === 0) {
            await pool.query('ALTER TABLE properties ADD COLUMN settings JSONB DEFAULT \'{}\'');
            console.log('SUCCESS: Added "settings" column.');
        } else {
            console.log('SKIPPED: "settings" column already exists.');
        }

        // Enable accounting for all existing properties by default
        await pool.query("UPDATE properties SET settings = settings || '{\"enable_accounting\": true}'");
        console.log('UPDATED: Enabled accounting for existing properties.');

        process.exit(0);
    } catch (err) {
        console.error('MIGRATION FAILED:', err.message);
        process.exit(1);
    }
}

migrate();
