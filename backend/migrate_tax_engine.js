const client = require('./src/config/database');

async function migrate() {
    try {
        console.log('Initiating Tax Engine database migration...');
        
        await client.query(`
            DO $$
            BEGIN
                -- 1. Add feature flag to properties table
                ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS enable_tax_engine BOOLEAN DEFAULT FALSE;
                
                -- 2. Create the property_taxes table
                CREATE TABLE IF NOT EXISTS public.property_taxes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    type VARCHAR(50) NOT NULL CHECK (type IN ('PERCENTAGE', 'FLAT_PER_NIGHT', 'FLAT_PER_STAY', 'PER_GUEST_PER_NIGHT')),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                -- 3. Enable RLS
                ALTER TABLE public.property_taxes ENABLE ROW LEVEL SECURITY;
                
                -- 4. Recreate RLS Policy securely allowing managers to CRUD their own property taxes
                DROP POLICY IF EXISTS "Users can manage taxes for their property" ON public.property_taxes;
                
                CREATE POLICY "Users can manage taxes for their property"
                ON public.property_taxes
                FOR ALL
                USING (property_id IN (SELECT property_id FROM public.users WHERE id = auth.uid()));
                
            END
            $$;
        `);
        
        console.log('Tax Engine schema successfully created.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
