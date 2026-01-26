const db = require('../../config/database');

// @desc    Get Daily Overview (Checked-In Guests & Financial Status)
// @route   GET /api/reports/daily-overview
// @access  Protected
const { validate: isUuid } = require('uuid'); // ensure uuid package is utilized if available, or regex
// Since we might not have uuid package installed in this file scope or at all, let's use regex for safety
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getDailyOverview = async (req, res) => {
    try {
        const { property_id } = req.query;

        if (!property_id) {
            return res.status(400).json({ message: 'Property ID is required' });
        }

        if (!UUID_REGEX.test(property_id)) {
            console.warn(`[DailyOverview] Invalid Property ID: ${property_id}`);
            return res.status(400).json({ message: 'Invalid Property ID format' });
        }

        const query = `
      SELECT 
        r.id AS reservation_id,
        r.check_in,
        r.check_out,
        r.total_amount AS total_price,
        r.status,
        g.first_name,
        g.last_name,
        rm.number AS room_number,
        rm.price_per_night,
        COALESCE(SUM(p.amount), 0) AS amount_paid
      FROM reservations r
      JOIN guests g ON r.guest_id = g.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN payments p ON r.id = p.res_id
      WHERE r.property_id = $1
        AND r.status = 'Checked In'
      GROUP BY r.id, g.id, rm.id
    `;

        const { rows } = await db.query(query, [property_id]);

        const today = new Date();

        // Process rows to calculate detailed financial metrics
        const report = rows.map(row => {
            const checkInDate = new Date(row.check_in);

            // Calculate days stayed so far (inclusive of today if checked in before today)
            // If checked in today, days stayed is 0 or 1 depending on policy. Let's assume 1 if it's the check-in day.
            const diffTime = Math.abs(today - checkInDate);
            const daysStayed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Ensure at least 1 day if freshly checked in
            const effectiveDays = daysStayed === 0 ? 1 : daysStayed;

            const rate = Number(row.price_per_night) || 0;
            const totalIncurred = effectiveDays * rate;
            const amountPaid = Number(row.amount_paid);
            const amountOwed = Math.max(0, totalIncurred - amountPaid);

            // Days behind calculation
            // How many days worth of stay are covered by payment?
            const daysPaidFor = rate > 0 ? Math.floor(amountPaid / rate) : 0;
            const daysBehind = Math.max(0, effectiveDays - daysPaidFor);

            return {
                reservation_id: row.reservation_id,
                guest_name: `${row.first_name} ${row.last_name}`,
                room_number: row.room_number || 'N/A',
                check_in: row.check_in,
                amount_paid: amountPaid,
                amount_owed: amountOwed, // Currently owed based on stay duration
                total_price: Number(row.total_price), // Total booking price
                days_behind: daysBehind,
                status: row.status
            };
        });

        // Sort by who owes the most (primary) and days behind (secondary)
        report.sort((a, b) => b.amount_owed - a.amount_owed || b.days_behind - a.days_behind);

        res.status(200).json(report);
    } catch (error) {
        console.error('Error fetching daily overview:', error);
        res.status(500).json({ message: 'Server error fetching daily overview' });
    }
};

module.exports = {
    getDailyOverview,
};
