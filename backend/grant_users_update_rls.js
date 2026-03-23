const client = require('./src/config/database');

async function migrate() {
    try {
        console.log('Granting UPDATE permissions on users table for authenticated owners...');
        
        await client.query(`
            DO $$
            BEGIN
                -- Ensure RLS is enabled
                ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
                
                -- Drop the policy if it exists so we can recreate it cleanly
                DROP POLICY IF EXISTS "Users can update their own row" ON public.users;
                
                -- Create the policy
                CREATE POLICY "Users can update their own row" 
                ON public.users 
                FOR UPDATE 
                USING (auth.uid() = id);
            END
            $$;
        `);
        
        console.log('Migration successful.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
