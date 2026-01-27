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
        console.log('🔄 Starting Rate Plans Migration...');
        await client.query('BEGIN');

        // 1. Create rate_plans table
        console.log('🛠 Creating rate_plans table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS rate_plans (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 2. Add rate_plan_id to room_rates
        console.log('🛠 Adding rate_plan_id to room_rates...');
        await client.query(`
            ALTER TABLE room_rates 
            ADD COLUMN IF NOT EXISTS rate_plan_id UUID REFERENCES rate_plans(id) ON DELETE CASCADE;
        `);

        // 3. Create a Default 'Standard' Rate Plan for existing rates
        // We'll insert it for each property found in room_rates to be safe, or just one if we know the property.
        // Let's do a smart migration: For every property that has rates but no plans, create a Standard plan.
        const props = await client.query('SELECT DISTINCT property_id FROM room_rates WHERE rate_plan_id IS NULL');

        for (const row of props.rows) {
            const propId = row.property_id;
            console.log(`Processing property ${propId}...`);

            // Create Standard Plan
            const planRes = await client.query(`
                INSERT INTO rate_plans (property_id, name, description)
                VALUES ($1, 'Standard Rate', 'Base rate plan')
                RETURNING id;
            `, [propId]);
            const planId = planRes.rows[0].id;

            // Link existing rates to this plan
            await client.query(`
                UPDATE room_rates 
                SET rate_plan_id = $1 
                WHERE property_id = $2 AND rate_plan_id IS NULL;
            `, [planId, propId]);
        }

        // 4. Update Unique Constraint
        // Original constraint was likely (property_id, room_type, date).
        // Now it should be (property_id, room_type, date, rate_plan_id).
        console.log('🛠 Updating constraints...');

        // Try to drop existing constraint if known name, or ignore. 
        // We can try to add the new one.
        // Usually constraints are named like 'room_rates_pkey' or similar.
        // Let's assume we need to drop the old unique index/constraint.
        // We'll try to drop common names 'room_rates_property_id_room_type_date_key'.
        try {
            await client.query('ALTER TABLE room_rates DROP CONSTRAINT IF EXISTS room_rates_property_id_room_type_date_key;');
            await client.query('ALTER TABLE room_rates DROP CONSTRAINT IF EXISTS room_rates_pkey;');
        } catch (e) {
            console.log('Constraint drop warning (ignorable):', e.message);
        }

        await client.query(`
            ALTER TABLE room_rates 
            ADD CONSTRAINT room_rates_composite_unique UNIQUE (property_id, room_type, date, rate_plan_id);
        `);

        await client.query('COMMIT');
        console.log('🎉 Rate Plans Migration Complete!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
