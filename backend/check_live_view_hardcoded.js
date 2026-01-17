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

async function checkView() {
    try {
        console.log('Checking view live_financial_overview (HARDCODED)...');
        const res = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'live_financial_overview'"
        );
        if (res.rows.length === 0) {
            console.log('ERROR: View live_financial_overview NOT FOUND!');
        } else {
            console.log('View found. Columns:');
            res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
        }
        process.exit(0);
    } catch (err) {
        console.error('Query Failed:', err.message);
        process.exit(1);
    }
}

checkView();
