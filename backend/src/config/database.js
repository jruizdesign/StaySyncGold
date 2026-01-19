const { Pool } = require('pg');
require('dotenv').config();

// DEBUGGING & VALIDATION
console.log("[DB CONFIG] Checking Connection Variables...");
let dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
  // 1. Sanitize: Remove wrapping quotes if present (common Render mistake)
  if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
    console.warn("[DB CONFIG] Removing quotes from DATABASE_URL");
    dbUrl = dbUrl.slice(1, -1);
  }

  // 2. Validate format
  try {
    const parsed = new URL(dbUrl);
    console.log(`[DB CONFIG] URL Protocol: ${parsed.protocol}`);
    // Ensure it starts with postgres
    if (!parsed.protocol.startsWith('postgres')) {
      console.error("[DB CONFIG] ERROR: DATABASE_URL must start with postgres://");
    }
  } catch (e) {
    console.error("[DB CONFIG] FATAL: DATABASE_URL is not a valid URL.", e.message);
    // Fallback or let it crash clearly
  }

  // Log safe version
  const safeUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`[DB CONFIG] Using URL: ${safeUrl}`);
} else {
  console.log("[DB CONFIG] No DATABASE_URL found. Using breakdown vars.");
}

const poolConfig = dbUrl
  ? { connectionString: dbUrl, ssl: { rejectUnauthorized: false } }
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
