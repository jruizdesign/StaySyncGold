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

async function reproduce() {
    const client = await pool.connect();
    try {
        console.log('🔍 Fetching a valid property ID...');
        const propRes = await client.query('SELECT id FROM properties LIMIT 1');
        if (propRes.rows.length === 0) {
            console.error('❌ No properties found to test with.');
            return;
        }
        const propertyId = propRes.rows[0].id;
        console.log(`✅ Using Property ID: ${propertyId}`);

        // Try insert with NULL user_id (simulating user not in auth table or optional)
        // Try insert with Type 'Expense'
        console.log('🚀 Attempting INSERT...');

        try {
            const res = await client.query(`
                INSERT INTO financial_transactions 
                (type, category, amount, description, property_id, processed_at, status)
                VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, ['Expense', 'Maintenance', 50.00, 'Test Transaction', propertyId, new Date().toISOString(), 'Completed']);

            console.log('✅ INSERT SUCCESS:', res.rows[0]);
        } catch (insertErr) {
            console.error('❌ INSERT FAILED:', insertErr);
            console.error('Code:', insertErr.code);
            console.error('Constraint:', insertErr.constraint);
            console.error('Detail:', insertErr.detail);
        }

    } catch (err) {
        console.error('❌ Script failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

reproduce();
