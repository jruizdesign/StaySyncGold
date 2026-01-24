const { Client } = require('pg');

// Explicit config to avoid connection string parsing issues with special chars in password
const client = new Client({
    user: 'postgres.hpgzwebgfjdwpaqwwoub',
    host: 'aws-0-us-west-2.pooler.supabase.com',
    database: 'postgres',
    password: 'RuizJ9199!!??',
    port: 6543,
    ssl: { rejectUnauthorized: false } // Required for Supabase in some envs
});

async function run() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully.');

        // 1. Get all users from auth.users
        const res = await client.query('SELECT id, email FROM auth.users');
        console.log('Found users in auth.users:', res.rows.map(u => u.email));

        if (res.rows.length === 0) {
            console.log('No users found in auth.users');
            return;
        }

        // 2. For each user, upsert into public.users and make them admin
        for (const user of res.rows) {
            console.log(`Fixing permissions for user: ${user.email} (${user.id})`);

            const upsertQuery = `
        INSERT INTO public.users (id, email, role, "isAdmin", "isManager")
        VALUES ($1, $2, 'admin', true, true)
        ON CONFLICT (id) 
        DO UPDATE SET 
          role = 'admin', 
          "isAdmin" = true, 
          "isManager" = true;
      `;

            await client.query(upsertQuery, [user.id, user.email]);
            console.log(`User ${user.email} successfully updated to ADMIN.`);
        }

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await client.end();
    }
}

run();
