require('dotenv').config();
const db = require('./src/config/database');

async function checkSchema() {
    try {
        const res = await db.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'properties'"
        );
        console.log('Columns:', res.rows.map(r => r.column_name));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
