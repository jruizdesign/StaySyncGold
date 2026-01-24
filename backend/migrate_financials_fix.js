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
        console.log('🔄 Starting Financials <-> Maintenance Migration...');

        await client.query('BEGIN');

        // 1. Add expenses and total_cost to maintenance table
        console.log('🛠 Checking maintenance table columns...');
        await client.query(`
            ALTER TABLE maintenance 
            ADD COLUMN IF NOT EXISTS expenses JSONB DEFAULT '[]',
            ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10, 2) DEFAULT 0.00;
        `);
        console.log('✅ Maintenance table updated.');

        // 2. Create financial_transactions table if not exists
        console.log('🛠 Checking financial_transactions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS financial_transactions (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
                reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
                type TEXT CHECK (type IN ('Income', 'Expense')) NOT NULL,
                category TEXT NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'Completed',
                processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID REFERENCES auth.users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ financial_transactions table checked/created.');

        // 3. Create index for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_financial_transactions_property 
            ON financial_transactions(property_id);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_financial_transactions_date 
            ON financial_transactions(processed_at);
        `);
        console.log('✅ Indices created.');

        await client.query('COMMIT');
        console.log('🎉 Migration completed successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
