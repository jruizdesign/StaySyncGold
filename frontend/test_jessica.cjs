const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hpgzwebgfjdwpaqwwoub.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZ3p3ZWJnZmpkd3BhcXd3b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI0MzYsImV4cCI6MjA4MzgxODQzNn0.aR7fHNOnNyIKpIBHP_wdtNj_GgxkR2g5a_b3NpyWKz0'
);

async function testJessica() {
    console.log('\nTesting jessica@ss.com');
    // Using a random password to see if it even signs in, but I already reset it to password123
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: 'jessica@ss.com', password: 'password123' });

    if (authError) {
        console.log('Login failed:', authError.message);
        return;
    }

    console.log(`Logged in as ID: ${authData.user.id}`);

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

    if (error) {
        console.log('RLS Error reading users by ID:', error.message);
    } else if (data) {
        console.log('Successfully read profile by ID:', data);
    } else {
        console.log('No profile returned by ID. Trying email fallback...');
    }
}

testJessica();
