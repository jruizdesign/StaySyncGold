const { Pool } = require('pg');
require('dotenv').config();

// Use the robust config pattern from my previous success
const poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function checkView() {
    try {
        console.log('Checking view live_financial_overview...');
        const res = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'live_financial_overview'"
        );
        if (res.rows.length === 0) {
            console.log('ERROR: View live_financial_overview NOT FOUND!');
        } else {
            console.log('View found. Columns:');
            res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

            // Verify specific columns we need
            const cols = res.rows.map(r => r.column_name);
            const needed = ['financial_priority', 'outstanding_balance', 'guest_name'];
            const missing = needed.filter(c => !cols.includes(c));
            if (missing.length > 0) {
                console.log('WARNING: Missing expected columns:', missing);
            } else {
                console.log('SUCCESS: All required columns present.');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Query Failed:', err.message);
        process.exit(1);
    }
}

checkView();
