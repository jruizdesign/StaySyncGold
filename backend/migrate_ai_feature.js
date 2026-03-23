const client = require('./src/config/database');

async function migrate() {
    try {
        console.log('Initiating AI Feature Flag migration...');
        
        await client.query(`
            DO $$
            BEGIN
                ALTER TABLE public.properties 
                ADD COLUMN IF NOT EXISTS enable_ai BOOLEAN DEFAULT FALSE;
            END
            $$;
        `);
        
        console.log('AI feature gates successfully added to the properties table.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
