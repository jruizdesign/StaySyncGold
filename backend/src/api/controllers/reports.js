const db = require('../../config/database');

// @desc    Get financial report
// @route   GET /api/reports/financial
// @access  Private (Admin, Manager) - RBAC will be implemented later
const getFinancialReport = async (req, res, next) => {
  try {
    // This is a placeholder. In a real app, this would query various tables
    // (Payments, Reservations, etc.) to generate a comprehensive report.
    const revenueResult = await db.query('SELECT SUM(amount) AS total_revenue FROM Payments WHERE status = $1', ['completed']);
    const totalRevenue = revenueResult.rows[0].total_revenue || 0;

    const reservationsResult = await db.query('SELECT COUNT(*) AS total_reservations FROM Reservations');
    const totalReservations = reservationsResult.rows[0].total_reservations || 0;

    res.status(200).json({
      totalRevenue: parseFloat(totalRevenue).toFixed(2),
      totalReservations,
      reportDate: new Date().toISOString().split('T')[0],
      // More detailed breakdown would be added here
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get daily room costs for long-term guests
// @route   GET /api/reports/daily-room-costs
// @access  Private (Admin, Manager)
const getDailyRoomCosts = async (req, res, next) => {
  try {
    // This query needs to be carefully crafted based on how "long-term" is defined
    // and how daily costs are calculated. For simplicity, we'll assume a reservation
    // is long-term if it's more than X days, and we'll calculate daily cost
    // by dividing total payment by number of days. This is a very simplified model.
    const { rows } = await db.query(
      `SELECT
        g.first_name,
        g.last_name,
        r.room_number,
        res.check_in,
        res.check_out,
        p.amount AS total_paid,
        (p.amount / NULLIF(EXTRACT(DAY FROM (res.check_out - res.check_in)), 0)) AS daily_cost -- Simplified daily cost
      FROM Reservations res
      JOIN Guests g ON res.guest_id = g.id
      JOIN Rooms r ON res.room_id = r.id
      LEFT JOIN Payments p ON res.id = p.res_id AND p.status = 'completed'
      WHERE (res.check_out - res.check_in) > INTERVAL '7 days' -- Example: long-term > 7 days
      ORDER BY daily_cost DESC NULLS LAST`
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get booking ledger (unified)
// @route   GET /api/reports/ledger
// @access  Private (Admin, Manager)
const getBookingLedger = async (req, res, next) => {
  try {
    const { property_id } = req.query;
    if (!property_id) return res.status(400).json({ error: 'Property ID required' });

    const result = await db.query(
      "SELECT * FROM bookings WHERE property_id = $1 ORDER BY arrival_date DESC",
      [property_id]
    );

    res.json({ success: true, bookings: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFinancialReport,
  getDailyRoomCosts,
  getBookingLedger,
};
