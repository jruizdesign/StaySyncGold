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

async function checkPolicies() {
    const client = await pool.connect();
    try {
        console.log('🔍 Checking RLS policies for financial_transactions...');

        const res = await client.query(`
            SELECT tablename, policyname, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'financial_transactions';
        `);

        if (res.rows.length === 0) {
            console.log('⚠️ No policies found for financial_transactions.');

            // Check if RLS is enabled
            const rlsCheck = await client.query(`
                SELECT relname, relrowsecurity 
                FROM pg_class 
                WHERE relname = 'financial_transactions';
            `);
            if (rlsCheck.rows.length > 0) {
                console.log(`RLS Enabled: ${rlsCheck.rows[0].relrowsecurity}`);
            }
        } else {
            console.table(res.rows);
        }

    } catch (err) {
        console.error('❌ Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkPolicies();
