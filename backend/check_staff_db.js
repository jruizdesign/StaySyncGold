require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
    user: process.env.DB_USER || 'postgres.hpgzwebgfjdwpaqwwoub',
    host: process.env.DB_HOST || 'aws-0-us-west-2.pooler.supabase.com',
    database: process.env.DB_DATABASE || 'postgres',
    password: process.env.DB_PASSWORD || 'RuizJ9199!!??',
    port: process.env.DB_PORT || 6543,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function checkStaff() {
    const client = await pool.connect();
    try {
        const staff = await client.query('SELECT id, firstname, last_name, pin FROM staff LIMIT 5;');
        console.log('Staff samples:', staff.rows);

        const policies = await client.query(`
            SELECT policyname, permissive, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'staff';
        `);
        console.log('Staff policies:', policies.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkStaff();
