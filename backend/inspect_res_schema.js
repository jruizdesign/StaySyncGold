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

async function inspect() {
    const client = await pool.connect();
    try {
        console.log('🔍 Inspecting reservations...');
        const resCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'reservations';
        `);
        resCols.rows.forEach(r => console.log(`Reservations: ${r.column_name} (${r.data_type})`));

        console.log('\n🔍 Inspecting payments...');
        const payCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payments';
        `);
        payCols.rows.forEach(r => console.log(`Payments: ${r.column_name} (${r.data_type})`));

        console.log('\n🔍 Inspecting rooms...');
        const roomCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rooms';
        `);
        roomCols.rows.forEach(r => console.log(`Rooms: ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error('❌ Inspection failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspect();
