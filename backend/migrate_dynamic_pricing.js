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
        console.log('🔄 Starting Dynamic Pricing Migration...');
        await client.query('BEGIN');

        // 1. Create organization_settings table (User requirements)
        console.log('🛠 Creating organization_settings table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS organization_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
                enable_dynamic_pricing BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Initialize settings for existing properties
        await client.query(`
            INSERT INTO organization_settings (property_id, enable_dynamic_pricing)
            SELECT id, false FROM properties
            ON CONFLICT (property_id) DO NOTHING;
        `);

        // 2. Create daily_rates table
        console.log('🛠 Creating daily_rates table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS daily_rates (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                price_override DECIMAL(10, 2),
                min_los INTEGER DEFAULT 1,
                rate_plan_id UUID REFERENCES rate_plans(id), -- Keeping this for compatibility with our recent Rate Plans work
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(room_type_id, date, rate_plan_id)
            );
        `);

        // 3. Migrate data from room_rates to daily_rates
        // room_rates uses (property_id, room_type string)
        // daily_rates uses (room_type_id)
        // We need to match on property_id and room_type name
        console.log('📦 Migrating room_rates data to daily_rates schema...');

        await client.query(`
            INSERT INTO daily_rates (room_type_id, date, price_override, rate_plan_id)
            SELECT 
                rt.id as room_type_id,
                rr.date,
                rr.price as price_override,
                rr.rate_plan_id
            FROM room_rates rr
            JOIN room_types rt ON rr.property_id = rt.property_id AND rr.room_type = rt.name
            ON CONFLICT (room_type_id, date, rate_plan_id) DO UPDATE 
            SET price_override = EXCLUDED.price_override;
        `);

        await client.query('COMMIT');
        console.log('🎉 Dynamic Pricing Migration Complete!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
