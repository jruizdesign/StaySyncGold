const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryRooms() {
    try {
        // Query rooms table
        const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select('*')
            .limit(10);

        if (roomsError) {
            console.error('Error querying rooms:', roomsError);
        } else {
            console.log('\n=== ROOMS ===');
            console.log(`Found ${rooms?.length || 0} rooms`);
            if (rooms && rooms.length > 0) {
                console.log(JSON.stringify(rooms, null, 2));
            }
        }

        // Query channel_settings
        const { data: settings, error: settingsError } = await supabase
            .from('channel_settings')
            .select('*');

        if (settingsError) {
            console.error('Error querying channel_settings:', settingsError);
        } else {
            console.log('\n=== CHANNEL SETTINGS ===');
            console.log(`Found ${settings?.length || 0} channel settings`);
            if (settings && settings.length > 0) {
                console.log(JSON.stringify(settings, null, 2));
            }
        }

        // Query channel_mappings
        const { data: mappings, error: mappingsError } = await supabase
            .from('channel_mappings')
            .select('*');

        if (mappingsError) {
            console.error('Error querying channel_mappings:', mappingsError);
        } else {
            console.log('\n=== CHANNEL MAPPINGS ===');
            console.log(`Found ${mappings?.length || 0} mappings`);
            if (mappings && mappings.length > 0) {
                console.log(JSON.stringify(mappings, null, 2));
            }
        }

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

queryRooms();
