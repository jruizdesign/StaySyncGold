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

async function inspect() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'maintenance';
        `);

        console.log('📋 Columns in maintenance:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

    } catch (err) {
        console.error('❌ Inspection failed:', err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

inspect();
