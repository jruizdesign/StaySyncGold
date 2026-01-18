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
        console.log('--- ROOMS TABLE ---');
        const roomsRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rooms';
        `);
        roomsRes.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log('\n--- CHANNEL_MAPPINGS TABLE ---');
        const mapRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'channel_mappings';
        `);
        mapRes.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspect();
