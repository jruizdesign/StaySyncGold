const { Pool } = require('pg');
require('dotenv').config();

// DEBUGGING: Log environment status
console.log("[DB CONFIG] Checking Connection Variables...");
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  console.log(`[DB CONFIG] DATABASE_URL found. Type: ${typeof dbUrl}, Length: ${dbUrl.length}`);
  // Show partial URL for verification (hide password)
  // Format usually postgres://user:pass@host...
  const sanitized = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`[DB CONFIG] Sanitized URL: ${sanitized}`);
} else {
  console.log("[DB CONFIG] No DATABASE_URL found. Using breakdown vars.");
  console.log(`[DB CONFIG] DB_HOST: ${process.env.DB_HOST}`);
}

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
  };

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
};
