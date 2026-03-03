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

async function checkUsers() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, email, role, "isAdmin" FROM public.users;');
        console.log('Public Users:', res.rows);

        try {
            const authRes = await client.query('SELECT id, email FROM auth.users;');
            console.log('Auth Users:', authRes.rows);
        } catch (e) {
            console.log('Cannot query auth.users:', e.message);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkUsers();
