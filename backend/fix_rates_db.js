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

async function fixRates() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Enabling dynamic pricing for all properties...');
        await client.query('UPDATE organization_settings SET enable_dynamic_pricing = true;');

        console.log('Fixing RLS for rate_plans...');
        await client.query('ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;');
        await client.query('DROP POLICY IF EXISTS "Enable all access for rate plans" ON rate_plans;');
        await client.query(`
            CREATE POLICY "Enable all access for rate plans" 
            ON rate_plans 
            FOR ALL 
            TO public 
            USING (true) 
            WITH CHECK (true);
        `);

        console.log('Fixing RLS for daily_rates...');
        await client.query('ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;');
        await client.query('DROP POLICY IF EXISTS "Enable all access for daily rates" ON daily_rates;');
        await client.query(`
            CREATE POLICY "Enable all access for daily rates" 
            ON daily_rates 
            FOR ALL 
            TO public 
            USING (true) 
            WITH CHECK (true);
        `);

        await client.query('COMMIT');
        console.log('Rates DB fixed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixRates();
