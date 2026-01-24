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

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Fixing RLS for financial_transactions...');

        await client.query('BEGIN');

        // Enable RLS
        await client.query('ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;');

        // Drop old policies
        await client.query('DROP POLICY IF EXISTS "Enable all for users based on property_id" ON financial_transactions;');
        await client.query('DROP POLICY IF EXISTS "Property isolation for financials" ON financial_transactions;');
        await client.query('DROP POLICY IF EXISTS "Insert for authenticated users" ON financial_transactions;');
        await client.query('DROP POLICY IF EXISTS "Read for authenticated users" ON financial_transactions;');

        // Create new policies

        // 1. Allow INSERT for authenticated users
        console.log('🛠 Creating INSERT policy...');
        await client.query(`
            CREATE POLICY "Insert for authenticated users" 
            ON financial_transactions 
            FOR INSERT 
            TO authenticated 
            WITH CHECK (true);
        `);

        // 2. Allow SELECT for authenticated users (optionally matching property_id if you want multitenancy strictness)
        console.log('🛠 Creating SELECT policy...');
        await client.query(`
            CREATE POLICY "Read for authenticated users" 
            ON financial_transactions 
            FOR SELECT 
            TO authenticated 
            USING (true);
        `);

        // 3. Allow UPDATE/DELETE if needed, for now just Insert/Select
        console.log('🛠 Creating UPDATE/DELETE policy...');
        await client.query(`
             CREATE POLICY "Modify for authenticated users" 
             ON financial_transactions
             FOR ALL
             TO authenticated
             USING (true)
             WITH CHECK (true);
        `);


        await client.query('COMMIT');
        console.log('🎉 Financials RLS Policies Applied!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
