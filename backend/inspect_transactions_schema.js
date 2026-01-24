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

async function inspectConstraints() {
    const client = await pool.connect();
    try {
        console.log('🔍 Inspecting financial_transactions constraints...');

        const res = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'financial_transactions';
        `);
        console.table(res.rows);

        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c 
            JOIN pg_namespace n ON n.oid = c.connamespace 
            WHERE c.conrelid = 'financial_transactions'::regclass;
        `);
        console.log('Constraints:');
        console.table(constraints.rows);

    } catch (err) {
        console.error('❌ Inspection failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspectConstraints();
