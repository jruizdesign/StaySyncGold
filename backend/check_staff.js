const { Pool } = require('pg');
const path = require('path');
// Load env from the backend directory specifically
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    user: 'jason', // Trying system user
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD, // This might be ignored for local socket auth
    port: process.env.DB_PORT,
};

console.log('Trying DB Config with user jason:', config);

const pool = new Pool(config);

async function checkData() {
    try {
        console.log('\n--- Pricing Tables Check ---');
        try {
            const rates = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%rate%' OR table_name LIKE '%price%'");
            console.table(rates.rows);
        } catch (e) {
            console.log("Error checking tables:", e.message);
        }

        console.log('\n--- Reservations Table Check ---');
        // Inspect reservations table for total_amount
        try {
            const reservationsResult = await pool.query('SELECT * FROM reservations LIMIT 1');
            const reservations = reservationsResult.rows;

            if (reservations.length === 0) {
                console.log('Reservations table: No rows found, cannot infer columns easily without schema inspection query');
            } else {
                const columns = Object.keys(reservations[0]);
                console.log('Reservations table columns sample:', columns);
                if (columns.includes('total_amount')) {
                    console.log('Reservations table contains "total_amount" column.');
                } else {
                    console.log('Reservations table does NOT contain "total_amount" column.');
                }
            }
        } catch (e) {
            console.error('Error fetching reservations:', e.message);
        }

        console.log('--- Properties ---');
        const props = await pool.query('SELECT id, name FROM properties');
        console.log(props.rows);

        console.log('\n--- Staff ---');
        const staff = await pool.query('SELECT id, name, property_id, role FROM staff');
        if (staff.rows.length === 0) {
            console.log('No staff records found in the database.');
        } else {
            console.table(staff.rows);
        }

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

checkData();
