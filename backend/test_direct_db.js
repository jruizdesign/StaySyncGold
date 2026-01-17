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

async function test() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Connected!', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}

test();
