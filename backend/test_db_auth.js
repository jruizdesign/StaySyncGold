require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

console.log(`Attempting connection with user: ${process.env.DB_USER}`);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Connection FAILED:', err.message);
        process.exit(1);
    } else {
        console.log('Connection SUCCESSFUL!');
        console.log('Database Time:', res.rows[0].now);
        process.exit(0);
    }
});
