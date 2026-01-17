require('dotenv').config();
const db = require('./src/config/database');

async function inspect() {
    try {
        const res = await db.query(
            "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('reservations', 'bookings')"
        );
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

inspect();
