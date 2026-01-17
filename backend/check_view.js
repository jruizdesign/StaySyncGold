require('dotenv').config();
const db = require('./src/config/database');

async function checkView() {
    try {
        const res = await db.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'live_financial_overview'"
        );
        console.log('Columns:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkView();
