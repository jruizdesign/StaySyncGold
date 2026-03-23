const client = require('./src/config/database');

async function migrate() {
    try {
        console.log('Initiating SaaS Feature Flag migration...');
        
        await client.query(`
            DO $$
            BEGIN
                ALTER TABLE public.properties 
                ADD COLUMN IF NOT EXISTS enable_finance_module BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS enable_quickbooks BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS enable_payments BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS enable_channel_manager BOOLEAN DEFAULT FALSE;
            END
            $$;
        `);
        
        console.log('SaaS feature gates successfully added to the properties table.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
