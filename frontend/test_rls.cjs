const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://hpgzwebgfjdwpaqwwoub.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZ3p3ZWJnZmpkd3BhcXd3b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDI0MzYsImV4cCI6MjA4MzgxODQzNn0.aR7fHNOnNyIKpIBHP_wdtNj_GgxkR2g5a_b3NpyWKz0'
);

async function testRLS(email, password) {
    console.log(`\nTesting ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
        console.log('Login failed:', authError.message);
        return;
    }

    console.log(`Logged in as ID: ${authData.user.id}`);

    // Simulate useAuth logic
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
        const { data: emailData, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (emailError) {
            console.log('RLS Error reading users by Email:', emailError.message);
        } else if (emailData) {
            console.log('Successfully read profile by Email:', emailData);
        } else {
            console.log('Total failure. RLS blocked all reads.');
        }
    }
}

(async () => {
    await testRLS('admin@ss.com', 'password123');
    await testRLS('demo@ss.com', 'password123');
})();
