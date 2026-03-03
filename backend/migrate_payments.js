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

async function checkOldPayments() {
    const client = await pool.connect();
    try {
        console.log('Checking if old `Payments` table exists...');
        const res = await client.query(`
            SELECT EXISTS (
                SELECT FROM pg_tables
                WHERE  schemaname = 'public'
                AND    tablename  = 'Payments'
            );
        `);
        console.log('Payments table exists?', res.rows[0].exists);
        if (res.rows[0].exists) {
            console.log('Renaming old `Payments` table to `legacy_payments` to avoid conflicts.');
            await client.query(`ALTER TABLE "Payments" RENAME TO "legacy_payments";`);
        }
    } catch (err) {
        console.log('Error checking/renaming', err.message);
    } finally {
        client.release();
    }
}

async function migratePayments() {
    await checkOldPayments();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating `payments` table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.payments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
                res_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
                amount NUMERIC(10,2) NOT NULL,
                currency TEXT DEFAULT 'usd' NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
                stripe_payment_intent_id TEXT UNIQUE,
                method TEXT DEFAULT 'card' NOT NULL,
                notes TEXT,
                receipt_url TEXT,
                metadata JSONB DEFAULT '{}'::jsonb
            );
        `);

        console.log('Creating `payment_methods` table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.payment_methods (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                profile_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
                stripe_payment_method_id TEXT UNIQUE NOT NULL,
                brand TEXT,
                last4 TEXT,
                exp_month INTEGER,
                exp_year INTEGER,
                is_default BOOLEAN DEFAULT false
            );
        `);

        console.log('Enabling RLS...');
        await client.query(`ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;`);
        await client.query(`ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;`);

        console.log('Creating RLS Policies...');
        // Payments allow select for authenticated users based on property
        await client.query(`
            DROP POLICY IF EXISTS "Users can view payments for their properties" ON public.payments;
            CREATE POLICY "Users can view payments for their properties" ON public.payments
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT id FROM public.users 
                    WHERE property_id = payments.property_id
                )
            );
        `);
        // Payment methods allow owner to manage their own
        await client.query(`
            DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
            CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
            FOR SELECT USING (auth.uid() = profile_id);
            
            DROP POLICY IF EXISTS "Users can insert their own payment methods" ON public.payment_methods;
            CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods
            FOR INSERT WITH CHECK (auth.uid() = profile_id);
            
            DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
            CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
            FOR UPDATE USING (auth.uid() = profile_id);
            
            DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
            CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods
            FOR DELETE USING (auth.uid() = profile_id);
        `);

        // Give admin role full access as a fallback if needed
        await client.query(`
            DROP POLICY IF EXISTS "Admins have full access" ON public.payments;
            CREATE POLICY "Admins have full access" ON public.payments
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
                )
            );
        `);

        await client.query('COMMIT');
        console.log('Migration successful.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migratePayments();
