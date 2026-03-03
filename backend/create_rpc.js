require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
    user: process.env.DB_USER || 'postgres.hpgzwebgfjdwpaqwwoub',
    host: process.env.DB_HOST || 'aws-0-us-west-2.pooler.supabase.com',
    database: process.env.DB_DATABASE || 'postgres',
    password: process.env.DB_PASSWORD || 'RuizJ9199!!??',
    port: process.env.DB_PORT || 6543,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

async function setupRPC() {
    const client = await pool.connect();
    try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
        await client.query(`
            CREATE OR REPLACE FUNCTION verify_staff_pin(staff_id_param UUID, pin_param TEXT)
            RETURNS BOOLEAN
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            DECLARE
                hashed_pin TEXT;
            BEGIN
                SELECT pin INTO hashed_pin FROM staff WHERE id = staff_id_param;
                IF hashed_pin IS NULL THEN
                    RETURN FALSE;
                END IF;
                -- Try plain text first (in case some are not hashed):
                IF hashed_pin = pin_param THEN
                    RETURN TRUE;
                END IF;
                -- Try bcrypt verify
                RETURN hashed_pin = crypt(pin_param, hashed_pin);
            END;
            $$;
        `);
        console.log('RPC verified!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setupRPC();
