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

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Adding derivation_rule column to rate_plans...');
        await client.query('BEGIN');

        await client.query(`
            ALTER TABLE rate_plans 
            ADD COLUMN IF NOT EXISTS derivation_rule JSONB;
        `);

        await client.query('COMMIT');
        console.log('🎉 Column added successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
