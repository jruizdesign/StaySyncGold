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

async function checkSchema() {
    const client = await pool.connect();
    try {
        const plans = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rate_plans';
        `);
        console.log('rate_plans columns:', plans.rows);

        const policies = await client.query(`
            SELECT policyname, permissive, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'rate_plans' OR tablename = 'daily_rates';
        `);
        console.log('policies:', policies.rows);

        const indexes = await client.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'daily_rates';
        `);
        console.log('daily_rates indexes:', indexes.rows);

        const settings = await client.query(`
            SELECT * FROM organization_settings;
        `);
        console.log('settings:', settings.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
