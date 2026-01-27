const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const getRates = async (startDate, endDate, propertyId, ratePlanId = null) => {
    const client = await pool.connect();
    try {
        // 1. Check Feature Flag
        const settingsRes = await client.query(
            'SELECT enable_dynamic_pricing FROM organization_settings WHERE property_id = $1',
            [propertyId]
        );
        const isDynamicEnabled = settingsRes.rows[0]?.enable_dynamic_pricing;

        // If OFF: Return static default_price
        if (!isDynamicEnabled) {
            const staticQuery = `
                WITH calendar_spine AS (
                    SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS report_date
                )
                SELECT 
                    cs.report_date,
                    rt.id as room_type_id,
                    rt.name as room_name,
                    rt.price_per_night as final_rate, -- Using default price
                    false as is_override
                FROM calendar_spine cs
                CROSS JOIN room_types rt
                WHERE rt.property_id = $3
                ORDER BY rt.id, cs.report_date;
             `;
            const res = await client.query(staticQuery, [startDate, endDate, propertyId]);
            return res.rows;
        }

        // If ON: Execute Calendar Spine Query with Overrides
        // Note: Modified slightly to handle rate_plan_id if provided/needed, 
        // but core request was room_type based overrides.
        // We'll join daily_rates and prefer overrides matching the plan if possible, 
        // or just base overides. simpler logic for now matching user request 100%.

        const spineQuery = `
            WITH calendar_spine AS (
                SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS report_date
            )
            SELECT 
                cs.report_date,
                rt.id as room_type_id,
                rt.name as room_name,
                COALESCE(dr.price_override, rt.price_per_night) as final_rate,
                CASE WHEN dr.price_override IS NOT NULL THEN true ELSE false END as is_override,
                dr.min_los
            FROM calendar_spine cs
            CROSS JOIN room_types rt
            LEFT JOIN daily_rates dr 
                ON rt.id = dr.room_type_id 
                AND cs.report_date = dr.date
                ${ratePlanId ? 'AND dr.rate_plan_id = $4' : 'AND dr.rate_plan_id IS NULL'}
            WHERE rt.property_id = $3
            ORDER BY rt.id, cs.report_date;
        `;

        const params = ratePlanId ? [startDate, endDate, propertyId, ratePlanId] : [startDate, endDate, propertyId];
        const res = await client.query(spineQuery, params);

        return res.rows;

    } catch (err) {
        console.error("Error in getRates:", err);
        throw err;
    } finally {
        client.release();
    }
};

const updateRate = async (propertyId, roomTypeId, date, price, ratePlanId = null) => {
    const client = await pool.connect();
    try {
        // Upsert daily_rate
        const query = `
            INSERT INTO daily_rates (room_type_id, date, price_override, rate_plan_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (room_type_id, date, rate_plan_id) 
            DO UPDATE SET price_override = EXCLUDED.price_override, created_at = NOW();
        `;
        await client.query(query, [roomTypeId, date, price, ratePlanId]);
        return { success: true };
    } finally {
        client.release();
    }
};

// Toggle Setting
const toggleDynamicPricing = async (propertyId, enabled) => {
    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO organization_settings (property_id, enable_dynamic_pricing)
            VALUES ($1, $2)
            ON CONFLICT (property_id) DO UPDATE SET enable_dynamic_pricing = $2;
        `, [propertyId, enabled]);
        return { success: true, enabled };
    } finally {
        client.release();
    }
};

// Apply Derivation Rule
const applyDerivationRule = async (propertyId, ratePlanId, rule) => {
    const client = await pool.connect();
    try {
        // 1. Fetch Base Rates (Standard Plan / Default Price) for next 365 days
        // We use the existing getRates query but strictly for NULL plan
        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);

        const startDate = today.toISOString().split('T')[0];
        const endDate = nextYear.toISOString().split('T')[0];

        // We can reuse getRates logic but we need raw rows to process?
        // Actually getRates returns exactly what we need: merged final_rate (base).
        // We pass ratePlanId as NULL to get standard rates.
        const baseRates = await getRates(startDate, endDate, propertyId, null);

        // 2. Calculate Derived Rates
        const updates = baseRates.map(base => {
            let newPrice = parseFloat(base.final_rate);
            const val = parseFloat(rule.value);

            if (rule.type === 'percent') {
                newPrice = newPrice + (newPrice * (val / 100));
            } else if (rule.type === 'fixed') {
                newPrice = val;
            } else if (rule.type === 'amount') {
                newPrice = newPrice + val;
            }

            return {
                room_type_id: base.room_type_id,
                date: base.report_date.toISOString().split('T')[0], // ensure proper format
                price: Math.round(newPrice * 100) / 100,
                rate_plan_id: ratePlanId
            };
        });

        // 3. Batch Upsert
        // We need a loop or json_to_recordset if vast. 365 * 10 rooms = 3650 rows.
        // Pool query with UNNEST is best for bulk.

        // Prepare arrays for UNNEST
        const roomTypeIds = updates.map(u => u.room_type_id);
        const dates = updates.map(u => u.date);
        const prices = updates.map(u => u.price);
        const planIds = updates.map(u => u.rate_plan_id);

        await client.query(`
            INSERT INTO daily_rates (room_type_id, date, price_override, rate_plan_id)
            SELECT * FROM UNNEST($1::uuid[], $2::date[], $3::decimal[], $4::uuid[])
            ON CONFLICT (room_type_id, date, rate_plan_id) 
            DO UPDATE SET price_override = EXCLUDED.price_override;
        `, [roomTypeIds, dates, prices, planIds]);

        return { success: true, count: updates.length };

    } catch (err) {
        console.error("Error applying rule:", err);
        throw err;
    } finally {
        client.release();
    }
};

module.exports = { getRates, updateRate, toggleDynamicPricing, applyDerivationRule };
