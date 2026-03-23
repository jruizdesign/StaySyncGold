const client = require('./src/config/database');

async function migrate() {
    try {
        console.log('Starting migration for Legal Agreement consent tracking...');
        
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS agreed_to_legal BOOLEAN DEFAULT FALSE;`);
        
        console.log('Successfully added agreed_to_legal column to users table.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
