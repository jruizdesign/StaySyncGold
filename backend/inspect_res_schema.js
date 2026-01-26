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

async function inspect() {
    const client = await pool.connect();
    try {
        console.log('🔍 Inspecting reservations...');
        console.log('🔍 Inspecting RLS Policies for feature_requests...');
        const policies = await client.query(`
            SELECT policyname, cmd, roles, qual, with_check 
            FROM pg_policies 
            WHERE tablename = 'feature_requests';
        `);
        if (policies.rows.length === 0) {
            console.log('No policies found! (If RLS is enabled, this means DENY ALL)');
        } else {
            policies.rows.forEach(p => {
                console.log(`Policy: ${p.policyname} | Action: ${p.cmd} | Roles: ${p.roles} | Using: ${p.qual}`);
            });
        }

        const rlsEnabled = await client.query(`
            SELECT relrowsecurity 
            FROM pg_class 
            WHERE relname = 'feature_requests';
        `);
        console.log('RLS Enabled:', rlsEnabled.rows[0]?.relrowsecurity);

        console.log('\n🔍 Inspecting payments...');
        const payCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payments';
        `);
        payCols.rows.forEach(r => console.log(`Payments: ${r.column_name} (${r.data_type})`));

        console.log('\n🔍 Inspecting rooms...');
        const roomCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rooms';
        `);
        roomCols.rows.forEach(r => console.log(`Rooms: ${r.column_name} (${r.data_type})`));

    } catch (err) {
        console.error('❌ Inspection failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

inspect();
