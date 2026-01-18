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

async function listTables() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);

        console.log('📋 Tables in public schema:');
        res.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
        });

    } catch (err) {
        console.error('❌ Listing failed:', err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

listTables();
