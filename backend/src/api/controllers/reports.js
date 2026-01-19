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

    // ROBUST: Link bookings to payments via raw_data->>'id' (Reservation UUID)
    // matches the res_id in payments table.
    // DYNAMIC ACCRUAL: If is_indefinite=true AND status='Checked In', we calculate total based on days stayed * daily_rate
    const result = await db.query(
      `SELECT b.*, 
        (SELECT COALESCE(SUM(p.amount), 0) 
         FROM payments p 
         WHERE p.res_id::text = b.raw_data->>'id' -- ID match
        ) as paid_amount,
        CASE 
          WHEN b.is_indefinite = true AND b.status = 'Checked In' THEN 
             GREATEST(1, (EXTRACT(DAY FROM NOW() - b.arrival_date)))::numeric * COALESCE(b.daily_rate, b.total_price)
          ELSE b.total_price 
        END as calculated_total
       FROM bookings b 
       WHERE b.property_id = $1 
       ORDER BY b.arrival_date DESC`,
      [property_id]
    );

    res.json({ success: true, bookings: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get dashboard stats (real-time)
// @route   GET /api/reports/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const { property_id } = req.query;
    if (!property_id) return res.status(400).json({ error: 'Property ID required' });

    const today = new Date().toISOString().split('T')[0];

    // 1. STATS CARDS
    // Check-ins Today
    const checkinsRes = await db.query(
      "SELECT COUNT(*) FROM bookings WHERE property_id = $1 AND arrival_date = $2 AND status != 'cancelled'",
      [property_id, today]
    );
    const checkins = parseInt(checkinsRes.rows[0].count);

    // Cleaning (Rooms with status 'dirty', 'cleaning', 'maintenance')
    // We assume 'rooms' table has 'status'. If strict schema fails, strict SQL might fail.
    // Safe fallback: assume 0 if query fails? No, let's try strict.
    let cleaning = 0;
    try {
      const cleaningRes = await db.query(
        "SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status IN ('dirty', 'cleaning', 'maintenance')",
        [property_id]
      );
      cleaning = parseInt(cleaningRes.rows[0].count);
    } catch (err) {
      console.warn("Could not fetch cleaning stats (schema mismatch?):", err.message);
    }

    // Occupancy (Active Bookings / Total Rooms)
    const totalRoomsRes = await db.query("SELECT COUNT(*) FROM rooms WHERE property_id = $1", [property_id]);
    const totalRooms = parseInt(totalRoomsRes.rows[0].count) || 1;

    const activeBookingsRes = await db.query(
      "SELECT COUNT(*) FROM bookings WHERE property_id = $1 AND arrival_date <= $2 AND departure_date > $2 AND status != 'cancelled'",
      [property_id, today]
    );
    const occupiedRooms = parseInt(activeBookingsRes.rows[0].count);
    const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

    // Total Revenue (All Time)
    const revenueRes = await db.query(
      "SELECT SUM(total_price) FROM bookings WHERE property_id = $1 AND status != 'cancelled'",
      [property_id]
    );
    const totalRevenue = parseFloat(revenueRes.rows[0].sum) || 0;


    // 2. CHART DATA (Last 7 Days)
    // Generate dates
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Daily Revenue
      // Note: This matches bookings created/arriving on that day? 
      // Or revenue recognized that day?
      // Simple View: Sum of total_price for bookings ARRIVING that day (or created? usually arrival for forecast)
      const dayRevRes = await db.query(
        "SELECT SUM(total_price) FROM bookings WHERE property_id = $1 AND arrival_date = $2 AND status != 'cancelled'",
        [property_id, dateStr]
      );
      const dayRevenue = parseFloat(dayRevRes.rows[0].sum) || 0;

      // Daily Occupancy
      const dayOccRes = await db.query(
        "SELECT COUNT(*) FROM bookings WHERE property_id = $1 AND arrival_date <= $2 AND departure_date > $2 AND status != 'cancelled'",
        [property_id, dateStr]
      );
      const dayOccupied = parseInt(dayOccRes.rows[0].count);
      const dayOccupancyRate = Math.round((dayOccupied / totalRooms) * 100);

      chartData.push({
        name: dayName,
        date: dateStr,
        revenue: dayRevenue,
        occupancy: dayOccupancyRate
      });
    }

    res.json({
      success: true,
      stats: {
        revenue: totalRevenue,
        occupancy: occupancyRate,
        checkins: checkins,
        cleaning: cleaning
      },
      chartData: chartData
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFinancialReport,
  getDailyRoomCosts,
  getBookingLedger,
  getDashboardStats,
};
