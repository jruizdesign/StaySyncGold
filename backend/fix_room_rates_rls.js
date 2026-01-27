require('dotenv').config();
const { Pool } = require('pg');

// Using the known working configuration
const poolConfig = {
    user: process.env.DB_USER || 'postgres.hpgzwebgfjdwpaqwwoub',
    host: process.env.DB_HOST || 'aws-0-us-west-2.pooler.supabase.com',
    database: process.env.DB_DATABASE || 'postgres',
    password: process.env.DB_PASSWORD || 'RuizJ9199!!??',
    port: process.env.DB_PORT || 6543,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function fixRLS() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting RLS Fix for room_rates...');

        await client.query('BEGIN');

        await client.query('ALTER TABLE room_rates ENABLE ROW LEVEL SECURITY;');

        console.log('🛠 Dropping old policies...');
        await client.query('DROP POLICY IF EXISTS "Enable read access for authenticated users" ON room_rates;');
        await client.query('DROP POLICY IF EXISTS "Enable insert for authenticated users" ON room_rates;');
        await client.query('DROP POLICY IF EXISTS "Enable update for authenticated users" ON room_rates;');
        await client.query('DROP POLICY IF EXISTS "Enable delete for authenticated users" ON room_rates;');
        await client.query('DROP POLICY IF EXISTS "Enable all access for authenticated users" ON room_rates;');

        console.log('🛠 Creating new policies...');
        // Allow all operations for authenticated users
        await client.query(`
            CREATE POLICY "Enable all access for authenticated users" 
            ON room_rates 
            FOR ALL 
            TO authenticated 
            USING (true) 
            WITH CHECK (true);
        `);

        await client.query('COMMIT');
        console.log('🎉 RLS Fix applied successfully for room_rates!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixRLS();
