const db = require('../../config/database');

// @desc    Get Accounting Overview (KPIs)
// @route   GET /api/accounting/overview
// @access  Private (Admin/Manager)
const getAccountingOverview = async (req, res) => {
    try {
        const { property_id } = req.query;
        if (!property_id) return res.status(400).json({ error: "Property ID required" });

        // 1. Check Feature Flag
        const propRes = await db.query("SELECT settings FROM properties WHERE id = $1", [property_id]);
        const settings = propRes.rows[0]?.settings || {};
        if (settings.enable_accounting === false) {
            return res.status(403).json({ error: "Accounting module disabled" });
        }

        // 2. Aggregate Data
        // Receivables from View
        const receivablesRes = await db.query(
            "SELECT SUM(outstanding_balance) as total_receivables FROM live_financial_overview WHERE property_id = $1",
            [property_id]
        );
        const totalReceivables = parseFloat(receivablesRes.rows[0]?.total_receivables) || 0;

        // Revenue / Projected (From bookings table for historical/future range)
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const next30Days = new Date(today);
        next30Days.setDate(today.getDate() + 30);

        const statsQuery = `
            SELECT 
                SUM(total_price) filter (where arrival_date >= $2 AND arrival_date <= $3) as revenue_ytd,
                SUM(total_price) filter (where arrival_date > $3 AND arrival_date <= $4) as projected_revenue
            FROM bookings 
            WHERE property_id = $1 AND status != 'cancelled'
        `;
        const statsRes = await db.query(statsQuery, [property_id, startOfYear.toISOString(), today.toISOString(), next30Days.toISOString()]);
        const totalRevenueYTD = parseFloat(statsRes.rows[0]?.revenue_ytd) || 0;
        const projectedRevenue = parseFloat(statsRes.rows[0]?.projected_revenue) || 0;

        // 3. AI Briefing
        // "Take the top 5 'Priority 1' rows"
        const topRisksRes = await db.query(
            `SELECT * FROM live_financial_overview 
             WHERE property_id = $1 AND financial_priority = 1 
             ORDER BY outstanding_balance DESC 
             LIMIT 5`,
            [property_id]
        );

        let riskData = topRisksRes.rows;
        // Fallback if no Priority 1 items found
        if (riskData.length === 0) {
            const anyRisks = await db.query(
                `SELECT * FROM live_financial_overview 
                 WHERE property_id = $1 AND outstanding_balance > 0 
                 ORDER BY financial_priority ASC, outstanding_balance DESC 
                 LIMIT 5`,
                [property_id]
            );
            riskData = anyRisks.rows;
        }

        // Generate Briefing
        let aiBriefing = "Financial briefing unavailable.";
        try {
            const { generateFinancialBriefing } = require('../../services/aiService');
            aiBriefing = await generateFinancialBriefing(riskData);
        } catch (aiError) {
            console.error("AI Generation Error:", aiError);
            aiBriefing = "Unable to generate AI briefing at this time.";
        }

        // 4. Calculate Occupancy Efficiency
        const todayStr = today.toISOString().split('T')[0];
        const occupancyQuery = `
            SELECT 
                (SELECT COUNT(*) FROM rooms WHERE property_id = $1) as total_rooms,
                (SELECT COUNT(*) FROM reservations WHERE property_id = $1 AND status IN ('Confirmed', 'Checked In') AND check_in <= $2 AND (check_out > $2 OR is_indefinite = true)) as occupied_rooms
        `;
        const occupancyRes = await db.query(occupancyQuery, [property_id, todayStr]);
        const totalRooms = parseInt(occupancyRes.rows[0]?.total_rooms) || 0;
        const occupiedRooms = parseInt(occupancyRes.rows[0]?.occupied_rooms) || 0;
        const occupancyEfficiency = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        res.json({
            receivables: totalReceivables,
            revenueYTD: totalRevenueYTD,
            projectedInput: projectedRevenue,
            occupancyEfficiency,
            aiBriefing
        });

    } catch (error) {
        console.error("Accounting Overview Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Daily Financial Actions (Debt Priority)
// @route   GET /api/accounting/daily
// @access  Private
const getDailyFinancials = async (req, res) => {
    try {
        const { property_id } = req.query;

        // Query the live view
        // Columns assumed: id, guest_name, room_number, outstanding_balance, departure_date, status, financial_priority
        const result = await db.query(
            `SELECT * FROM live_financial_overview 
             WHERE property_id = $1 
             AND outstanding_balance > 0
             ORDER BY financial_priority ASC`, // Priority 1 is top
            [property_id]
        );

        const actions = result.rows.map(row => ({
            id: row.reservation_id || row.id,
            guestName: row.guest_name,
            room: row.room_number || row.room_type,
            balance: parseFloat(row.outstanding_balance),
            checkout: row.departure_date,
            status: row.status,
            priorityScore: row.financial_priority, // 1, 2, 3...
            priorityLabel: row.financial_priority === 1 ? 'Critical (Checkout Today)' :
                row.financial_priority === 2 ? 'High (In-House)' :
                    row.financial_priority === 3 ? 'Medium (Future)' : 'Low'
        }));

        res.json(actions);

    } catch (error) {
        console.error("Daily Financials Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get Ledger (Immutable View)
// @route   GET /api/accounting/ledger
// @access  Private
const getLedger = async (req, res) => {
    try {
        const { property_id } = req.query;
        // Simple select all from bookings for immutable ledger
        const result = await db.query(
            "SELECT * FROM bookings WHERE property_id = $1 ORDER BY created_at DESC",
            [property_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAccountingOverview,
    getDailyFinancials,
    getLedger
};
