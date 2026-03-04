const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testPropertyData() {
    const { data: properties } = await supabase.from('properties').select('id, name').limit(1);
    if (!properties || properties.length === 0) {
        console.log('No properties found');
        return;
    }
    const propertyId = properties[0].id;
    console.log('Checking for Property:', properties[0].name, 'ID:', propertyId);

    const { data: rooms, error: err1 } = await supabase.from('rooms').select('*').eq('property_id', propertyId);
    console.log('Rooms error:', err1, 'Count:', rooms ? rooms.length : 0);

    const { data: res, error: err2 } = await supabase.from('reservations').select('*').eq('property_id', propertyId).limit(5);
    console.log('Reservations error:', err2, 'Count:', res ? res.length : 0);

    const { data: shifts, error: err3 } = await supabase.from('staff_shifts').select('*').eq('property_id', propertyId);
    console.log('Shifts error:', err3, 'Count:', shifts ? shifts.length : 0);
}
testPropertyData();
