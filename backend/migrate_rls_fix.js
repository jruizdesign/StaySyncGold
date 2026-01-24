require('dotenv').config();
const { Pool } = require('pg');

// Using the known working configuration
const poolConfig = {
    user: 'postgres.hpgzwebgfjdwpaqwwoub',
    host: 'aws-0-us-west-2.pooler.supabase.com',
    database: 'postgres',
    password: 'RuizJ9199!!??',
    port: 6543,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting RLS Fix for system_logs...');

        await client.query('BEGIN');

        // 1. Enable RLS explicitly (good practice, though likely already on)
        await client.query('ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;');

        // 2. Drop existing policies to avoid conflicts or strictness
        console.log('🛠 Dropping old policies...');
        await client.query('DROP POLICY IF EXISTS "Allow inserts for authenticated users" ON system_logs;');
        await client.query('DROP POLICY IF EXISTS "Allow inserts for all users" ON system_logs;');
        await client.query('DROP POLICY IF EXISTS "Allow read for authenticated users" ON system_logs;');

        // 3. Create permissive insert policy
        // Allowing 'anon' and 'authenticated' roles to insert logs is common for frontend logging
        // Adjust 'TO public' if you want it effectively open for valid Supabase roles
        console.log('🛠 Creating new insert policy...');
        await client.query(`
            CREATE POLICY "Allow inserts for authenticated and anon" 
            ON system_logs 
            FOR INSERT 
            TO public 
            WITH CHECK (true);
        `);

        // 4. Create read policy (restricted to authenticated usually, or admins)
        console.log('🛠 Creating new select policy...');
        await client.query(`
            CREATE POLICY "Allow read for authenticated users" 
            ON system_logs 
            FOR SELECT 
            TO authenticated 
            USING (true);
        `);

        await client.query('COMMIT');
        console.log('🎉 RLS Fix applied successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
