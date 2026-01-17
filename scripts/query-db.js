const { createClient } = require('@supabase/supabase-js');

// Read from .env.local
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvVar = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.+)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryDatabase() {
    try {
        // Query properties table
        console.log('\n=== PROPERTIES ===');
        const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('*');

        if (propError) {
            console.error('Error querying properties:', propError);
        } else {
            console.log(`Found ${properties?.length || 0} properties`);
            if (properties && properties.length > 0) {
                properties.forEach(p => {
                    console.log(`- ID: ${p.id}, Name: ${p.name || p.location}`);
                });
            }
        }

        // Query rooms table
        console.log('\n=== ROOMS ===');
        const { data: rooms, error: roomsError } = await supabase
            .from('rooms')
            .select('*')
            .limit(10);

        if (roomsError) {
            console.error('Error querying rooms:', roomsError);
        } else {
            console.log(`Found ${rooms?.length || 0} rooms`);
            if (rooms && rooms.length > 0) {
                rooms.forEach(r => {
                    console.log(`- ID: ${r.id}, Name: ${r.name}, Type: ${r.type}, Property ID: ${r.property_id}`);
                });
            }
        }

        // Query channel_settings
        console.log('\n=== CHANNEL SETTINGS ===');
        const { data: settings, error: settingsError } = await supabase
            .from('channel_settings')
            .select('*');

        if (settingsError) {
            console.error('Error querying channel_settings:', settingsError);
        } else {
            console.log(`Found ${settings?.length || 0} channel settings`);
            if (settings && settings.length > 0) {
                settings.forEach(s => {
                    console.log(`- ID: ${s.id}, Property ID: ${s.property_id}, Channel: ${s.channel_name}, Channex Property ID: ${s.channex_property_id}`);
                });
            }
        }

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

queryDatabase();
