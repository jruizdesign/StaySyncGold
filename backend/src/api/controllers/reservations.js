const db = require('../../config/database');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Public
const getReservations = async (req, res, next) => {
  try {
    const { status, type, limit_years } = req.query;

    let query = 'SELECT * FROM Reservations';
    const params = [];
    const conditions = [];

    // Filter by single status or multiple (comma separated)
    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      params.push(statuses);
      conditions.push(`status = ANY($${params.length})`);
    }

    // "Archived" type shorthand
    if (type === 'archived') {
      // Checked Out or Cancelled
      const archivedStatuses = ['Checked Out', 'Cancelled'];
      // Avoid conflict if status is also passed, but usually one or other
      if (!status) {
        params.push(archivedStatuses);
        conditions.push(`status = ANY($${params.length})`);
      }

      // Limit to last 3 years (or limit_years param)
      const years = parseInt(limit_years) || 3;
      params.push(`${years} years`);
      conditions.push(`check_out >= NOW() - $${params.length}::INTERVAL`);
    } else if (type === 'active') {
      const activeStatuses = ['Confirmed', 'Checked In', 'Pending'];
      if (!status) {
        params.push(activeStatuses);
        conditions.push(`status = ANY($${params.length})`);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY check_in DESC';

    const { rows } = await db.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: error.message });
  }
};

// Helper for System Logging
const logSystemEvent = async (client, level, message, type, event, property_id, user_id, details) => {
  try {
    await client.query(
      `INSERT INTO system_logs (level, message, type, event, property_id, user_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [level, message, type, event, property_id, user_id, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Failed to write system log:', err);
    // Don't block main flow if logging fails
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Public
const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM Reservations WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Public
// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Public
const createReservation = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { property_id, guest_id, room_id, check_in, check_out, status, total_price, starting_balance } = req.body;

    // Start transaction
    await client.query('BEGIN');

    // NOTE: RLS context via user_id removed as requested.
    // Ensure database user has privileges to insert without RLS impersonation.

    let final_total = Number(total_price) || 0;
    const sBalance = Number(starting_balance) || 0;
    if (sBalance > 0) {
        final_total += sBalance;
    }

    // 1. Create Reservation
    const { rows: resRows } = await client.query(
      'INSERT INTO Reservations (property_id, guest_id, room_id, check_in, check_out, status, total_amount) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [property_id, guest_id, room_id, check_in, check_out, status, final_total]
    );
    const reservation = resRows[0];

    // Insert Starting Balance as a manual charge if > 0
    if (sBalance > 0) {
      await client.query(
        `INSERT INTO financial_transactions (reservation_id, amount, type, description, category, property_id, created_at)
         VALUES ($1, $2, 'charge', 'Prior Balance Forward', 'Service', $3, NOW())`,
        [reservation.id, sBalance, property_id]
      );
    }

    // 2. Sync to Bookings table (for Financials/Channex consistency)
    // Fetch details needed for bookings table
    const guestRes = await client.query('SELECT first_name, last_name FROM Guests WHERE id = $1', [guest_id]);
    const roomRes = await client.query('SELECT rt.name as type FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = $1', [room_id]);

    const guestName = guestRes.rows.length > 0 ? `${guestRes.rows[0].first_name} ${guestRes.rows[0].last_name}` : 'Unknown Guest';
    const roomType = (roomRes.rows.length > 0 && roomRes.rows[0].type) ? roomRes.rows[0].type : 'Standard'; // Fallback

    // Insert into bookings
    await client.query(
      `INSERT INTO bookings (
            property_id, 
            channel_booking_id, 
            guest_name, 
            total_price, 
            currency, 
            status, 
            arrival_date, 
            departure_date, 
            room_type,
            source,
            raw_data,
            created_at,
            updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'manual', $10, NOW(), NOW())`,
      [
        property_id,
        `local_${reservation.id}`, // Generate a local ID
        guestName,
        final_total, // Ensure we capture the money!
        'USD',
        status,
        check_in,
        check_out,
        roomType,
        JSON.stringify(reservation)
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(reservation);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// @desc    Update a reservation
// @route   PUT /api/reservations/:id
// @access  Public
const updateReservation = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    console.log('[DEBUG] updateReservation called for ID:', id);
    console.log('[DEBUG] updateReservation called for ID:', id);
    // console.log('[DEBUG] Request Body:', req.body); // REMOVED FOR SECURITY (PII PREV)
    const { property_id, guest_id, room_id, check_in, check_out, status, total_price, modified_by, modifier_name, daily_price, is_indefinite } = req.body;
    let finalTotalPrice = total_price;

    // Start transaction
    await client.query('BEGIN');

    // EARLY/LATE CHECKOUT LOGIC
    if (status === 'Checked Out') {
      try {
        const { rows: roomRows } = await client.query('SELECT price_per_night FROM rooms WHERE id = $1', [room_id]);
        if (roomRows.length > 0) {
          const pricePerNight = Number(roomRows[0].price_per_night) || 0;

          const start = new Date(check_in);
          const end = new Date(check_out);
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
          const nights = diffDays < 1 ? 1 : diffDays;

          finalTotalPrice = nights * pricePerNight;
          console.log(`[Checkout] Recalculated base price: ${nights} nights @ $${pricePerNight} = $${finalTotalPrice}`);

          // LATE CHECKOUT FEE: After 12 PM = +$10
          const now = new Date(); // Warning: Uses server local time. Ensure server time matches property time.
          const currentHour = now.getHours();
          // We only apply this if the checkout date matches today (to avoid retroactively applying fees if updating old records)
          // Simplified check: if checking out NOW, we assume action is real-time.
          if (currentHour >= 12) {
            console.log(`[Checkout] Check-out after 12:00 PM (Hour: ${currentHour}). Applying $10 Late Fee.`);
            finalTotalPrice += 10;
          }
        }
      } catch (err) {
        console.error("Error recalculating price:", err);
        // Fallback to original total_price if error
      }
    }

    const { rows } = await client.query(
      'UPDATE Reservations SET property_id = $1, guest_id = $2, room_id = $3, check_in = $4, check_out = $5, status = $6, total_amount = $8 WHERE id = $7 RETURNING *',
      [property_id, guest_id, room_id, check_in, check_out, status, id, finalTotalPrice]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Sync to Bookings table
    // Fetch details needed for bookings table
    const guestRes = await client.query('SELECT first_name, last_name FROM Guests WHERE id = $1', [guest_id]);
    const roomRes = await client.query('SELECT rt.name as type FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id = $1', [room_id]);

    const guestName = guestRes.rows.length > 0 ? `${guestRes.rows[0].first_name} ${guestRes.rows[0].last_name}` : 'Unknown Guest';
    const roomType = (roomRes.rows.length > 0 && roomRes.rows[0].type) ? roomRes.rows[0].type : 'Standard';

    // ROBUST SYNC: Try to find booking by local ID OR by raw_data->>'id'
    // This allows syncing reservations created by seed/external sources if they carry the ID in raw_data
    const bookingSearch = await client.query(
      `SELECT channel_booking_id FROM bookings 
       WHERE channel_booking_id = $1 OR raw_data->>'id' = $2`,
      [`local_${id}`, id]
    );

    let targetBookingId = `local_${id}`;
    if (bookingSearch.rows.length > 0) {
      targetBookingId = bookingSearch.rows[0].channel_booking_id;
    } else {
      console.warn(`[SYNC] No matching booking found for Reservation ${id}. Creating new booking record...`);
      // Self-healing: Create the missing booking record
      try {
        await client.query(
          `INSERT INTO bookings (
                property_id, 
                channel_booking_id, 
                guest_name, 
                total_price, 
                currency, 
                status, 
                arrival_date, 
                departure_date, 
                room_type,
                source,
                raw_data,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'manual', $10, NOW(), NOW())`,
          [
            property_id,
            targetBookingId, // Use local_ID
            guestName,
            total_price || 0,
            'USD',
            status,
            check_in,
            check_out,
            roomType,
            JSON.stringify({ id, property_id, guest_id, room_id, check_in, check_out, status, total_price, daily_price, is_indefinite }) // minimal raw_data
          ]
        );
        console.log(`[SYNC] Created missing booking ${targetBookingId}`);
        // Skip the update step since we just inserted
        await client.query('COMMIT');
        return res.status(200).json(rows[0]);
      } catch (insertError) {
        console.error("[SYNC] Failed to auto-create booking:", insertError.message);
        // Continue to try update if possible, or just log error
      }
    }

    // CALCULATE DAILY RATE: If not provided, derive from total / nights
    let dailyRate = daily_price; // Assuming passed in payload, else calculate
    if (!dailyRate && finalTotalPrice && check_in && check_out) {
      const nights = Math.max(1, (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
      dailyRate = finalTotalPrice / nights;
    }
    // If indefinite, total_price is 1 night (or placeholder), so dailyRate ~ total_price
    if (is_indefinite) {
      dailyRate = finalTotalPrice;
    }

    if (bookingSearch.rows.length > 0) {
      await client.query(
        `UPDATE bookings SET 
            total_price = COALESCE($1, total_price), 
            status = COALESCE($2, status), 
            arrival_date = COALESCE($3, arrival_date), 
            departure_date = COALESCE($4, departure_date),
            guest_name = COALESCE($5, guest_name),
            room_type = COALESCE($6, room_type),
            daily_rate = COALESCE($7, daily_rate),
            is_indefinite = COALESCE($8, is_indefinite),
            updated_at = NOW()
        WHERE channel_booking_id = $9`,
        [finalTotalPrice, status, check_in, check_out, guestName, roomType, dailyRate, is_indefinite, targetBookingId]
      );
      console.log(`[SYNC] Updated booking ${targetBookingId} for Reservation ${id}`);
    } else {
      // Insert new
      await client.query(
        `INSERT INTO bookings 
         (property_id, channel_booking_id, guest_name, total_price, currency, status, arrival_date, departure_date, room_type, source, raw_data, daily_rate, is_indefinite, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [property_id, targetBookingId, guestName, total_price, 'USD', status, check_in, check_out, roomType, 'manual', JSON.stringify({ id, property_id, guest_id, room_id, check_in, check_out, status, total_price, daily_price, is_indefinite }), dailyRate, is_indefinite]
      );
      console.log(`[SYNC] Created new booking ${targetBookingId}`);
    }

    // 3. Handle Room Status Changes (Check-in/Check-out)
    if (status === 'Checked In') {
      await client.query('UPDATE rooms SET status = $1 WHERE id = $2', ['Occupied', room_id]);
    } else if (status === 'Checked Out') {
      await client.query('UPDATE rooms SET status = $1 WHERE id = $2', ['Dirty', room_id]);
    }

    // System Log
    if (modified_by) {
      await logSystemEvent(
        client,
        'INFO',
        `Reservation updated by ${modifier_name || 'Staff'}: ${guestName} (${status})`,
        'RESERVATION',
        'RESERVATION_UPDATE',
        property_id,
        modified_by,
        { reservation_id: id, status, total_price }
      );
    }

    await client.query('COMMIT');
    res.status(200).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// @desc    Delete a reservation
// @route   DELETE /api/reservations/:id
// @access  Public
const deleteReservation = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { modified_by, modifier_name } = req.query; // Get from query params for DELETE

    await client.query('BEGIN');

    // Set RLS Context Pattern
    if (modified_by) {
      await client.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [modified_by]);
      await client.query("SET LOCAL role authenticated");
    }

    // Fetch property_id before deletion for logging
    const { rows: existingRows } = await client.query('SELECT property_id FROM Reservations WHERE id = $1', [id]);
    const property_id = existingRows.length > 0 ? existingRows[0].property_id : null;

    const { rowCount } = await client.query('DELETE FROM Reservations WHERE id = $1', [id]);
    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Delete from bookings
    await client.query('DELETE FROM bookings WHERE channel_booking_id = $1', [`local_${id}`]);

    // System Log
    if (modified_by) {
      await logSystemEvent(
        client,
        'WARNING',
        `Reservation deleted by ${modifier_name || 'Staff'} (ID: ${id})`,
        'RESERVATION',
        'RESERVATION_DELETE',
        property_id,
        modified_by,
        { reservation_id: id }
      );
    }

    await client.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// @desc    Add a charge to a reservation
// @route   POST /api/reservations/:id/charges
// @access  Public
const addCharge = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { amount, description, category, added_by } = req.body;

    console.log(`[CHARGES] Adding charge to Res ${id}: $${amount} - ${description}`);

    await client.query('BEGIN');

    // 1. Fetch current reservation
    const { rows: resRows } = await client.query('SELECT * FROM Reservations WHERE id = $1', [id]);
    if (resRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Reservation not found' });
    }
    const reservation = resRows[0];

    // 2. Create Transaction Record
    await client.query(
      `INSERT INTO financial_transactions (reservation_id, amount, type, description, category, created_at)
       VALUES ($1, $2, 'charge', $3, $4, NOW())`,
      [id, amount, description, category || 'Service']
    );

    // 3. Update Reservation Total
    const newTotal = Number(reservation.total_amount || 0) + Number(amount);
    await client.query(
      'UPDATE Reservations SET total_amount = $1 WHERE id = $2',
      [newTotal, id]
    );

    // 4. Update Bookings (Sync)
    // We update total_price in bookings to match
    // Note: We use the logic from updateReservation to ensure channel matching
    // Find booking ID
    const bookingSearch = await client.query(
      `SELECT channel_booking_id FROM bookings WHERE channel_booking_id = $1 OR raw_data->>'id' = $2`,
      [`local_${id}`, id]
    );

    if (bookingSearch.rows.length > 0) {
      const channelBookingId = bookingSearch.rows[0].channel_booking_id;
      await client.query(
        'UPDATE bookings SET total_price = $1, updated_at = NOW() WHERE channel_booking_id = $2',
        [newTotal, channelBookingId]
      );
      console.log(`[SYNC] Updated booking ${channelBookingId} total to $${newTotal}`);
    }

    // System Log
    if (added_by) {
      await logSystemEvent(
        client, 'INFO',
        `Added charge: $${amount} (${description})`,
        'FINANCIAL', 'CHARGE_ADDED',
        reservation.property_id,
        added_by,
        { reservation_id: id, amount, description }
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ success: true, new_total: newTotal });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error adding charge:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
  addCharge,
};
