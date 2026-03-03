const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hpgzwebgfjdwpaqwwoub.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZ3p3ZWJnZmpkd3BhcXd3b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI0MzYsImV4cCI6MjA4MzgxODQzNn0.aR7fHNOnNyIKpIBHP_wdtNj_GgxkR2g5a_b3NpyWKz0'
);

async function testLogin(email) {
    const passwords = ['password', 'password123', 'admin', 'demo', '123456', 'RuizJ9199!!??'];
    for (const p of passwords) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: p });
        if (!error) {
            console.log(`Success for ${email} with password: ${p}`);
            return;
        }
        if (error.message !== 'Invalid login credentials') {
            console.log(`Error for ${email} (${p}):`, error.message);
        }
    }
    console.log(`Failed to guess password for ${email}.`);
}

(async () => {
    await testLogin('admin@ss.com');
    await testLogin('demo@ss.com');
    await testLogin('demo_manager@ss.com');
    await testLogin('jessica@ss.com');
})();
