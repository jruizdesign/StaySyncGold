const db = require('../../config/database');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Public
const getReservations = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM Reservations');
    res.status(200).json(rows);
  } catch (error) {
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
const createReservation = async (req, res, next) => {
  try {
    const { property_id, guest_id, room_id, check_in, check_out, status, total_price } = req.body;

    // Start transaction
    await db.query('BEGIN');

    // 1. Create Reservation
    const { rows: resRows } = await db.query(
      'INSERT INTO Reservations (property_id, guest_id, room_id, check_in, check_out, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [property_id, guest_id, room_id, check_in, check_out, status]
    );
    const reservation = resRows[0];

    // 2. Sync to Bookings table (for Financials/Channex consistency)
    // Fetch details needed for bookings table
    const guestRes = await db.query('SELECT first_name, last_name FROM Guests WHERE id = $1', [guest_id]);
    const roomRes = await db.query('SELECT type FROM rooms WHERE id = $1', [room_id]);

    const guestName = guestRes.rows.length > 0 ? `${guestRes.rows[0].first_name} ${guestRes.rows[0].last_name}` : 'Unknown Guest';
    const roomType = roomRes.rows.length > 0 ? roomRes.rows[0].type : 'Standard'; // Fallback

    // Insert into bookings
    await db.query(
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
        total_price || 0, // Ensure we capture the money!
        'USD',
        status,
        check_in,
        check_out,
        roomType,
        JSON.stringify(reservation)
      ]
    );

    await db.query('COMMIT');
    res.status(201).json(reservation);
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update a reservation
// @route   PUT /api/reservations/:id
// @access  Public
const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('[DEBUG] updateReservation called for ID:', id);
    console.log('[DEBUG] Request Body:', req.body);
    const { property_id, guest_id, room_id, check_in, check_out, status, total_price, modified_by, modifier_name } = req.body;

    await db.query('BEGIN');

    const { rows } = await db.query(
      'UPDATE Reservations SET property_id = $1, guest_id = $2, room_id = $3, check_in = $4, check_out = $5, status = $6 WHERE id = $7 RETURNING *',
      [property_id, guest_id, room_id, check_in, check_out, status, id]
    );
    if (rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Sync to Bookings table
    // Fetch details needed for bookings table
    const guestRes = await db.query('SELECT first_name, last_name FROM Guests WHERE id = $1', [guest_id]);
    const roomRes = await db.query('SELECT type FROM rooms WHERE id = $1', [room_id]);

    const guestName = guestRes.rows.length > 0 ? `${guestRes.rows[0].first_name} ${guestRes.rows[0].last_name}` : 'Unknown Guest';
    const roomType = roomRes.rows.length > 0 ? roomRes.rows[0].type : 'Standard';

    // ROBUST SYNC: Try to find booking by local ID OR by raw_data->>'id'
    // This allows syncing reservations created by seed/external sources if they carry the ID in raw_data
    const bookingSearch = await db.query(
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
        await db.query(
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
            JSON.stringify({ id, property_id, guest_id, room_id, check_in, check_out, status, total_price }) // minimal raw_data
          ]
        );
        console.log(`[SYNC] Created missing booking ${targetBookingId}`);
        // Skip the update step since we just inserted
        return res.status(200).json(rows[0]);
      } catch (insertError) {
        console.error("[SYNC] Failed to auto-create booking:", insertError.message);
        // Continue to try update if possible, or just log error
      }
    }

    // CALCULATE DAILY RATE: If not provided, derive from total / nights
    let dailyRate = daily_price; // Assuming passed in payload, else calculate
    if (!dailyRate && total_price && check_in && check_out) {
      const nights = Math.max(1, (new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
      dailyRate = total_price / nights;
    }
    // If indefinite, total_price is 1 night (or placeholder), so dailyRate ~ total_price
    if (is_indefinite) {
      dailyRate = total_price;
    }

    if (bookingSearch.rows.length > 0) {
      await db.query(
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
        [total_price, status, check_in, check_out, guestName, roomType, dailyRate, is_indefinite, targetBookingId]
      );
      console.log(`[SYNC] Updated booking ${targetBookingId} for Reservation ${id}`);
    } else {
      // Insert new
      await db.query(
        `INSERT INTO bookings 
         (property_id, channel_booking_id, guest_name, total_price, currency, status, arrival_date, departure_date, room_type, source, raw_data, daily_rate, is_indefinite, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [property_id, targetBookingId, guestName, total_price, 'USD', status, check_in, check_out, roomType, 'manual', JSON.stringify({ id, property_id, guest_id, room_id, check_in, check_out, status, total_price, daily_price, is_indefinite }), dailyRate, is_indefinite]
      );
      console.log(`[SYNC] Created new booking ${targetBookingId}`);
    }  // Optional: Reset if moved back to confirmed? Or assume 'Clean'/'Inspected' if not occupied?
    // 3. Handle Room Status Changes (Check-in/Check-out)
    if (status === 'Checked In') {
      await db.query('UPDATE rooms SET status = $1 WHERE id = $2', ['Occupied', room_id]);
    } else if (status === 'Checked Out') {
      await db.query('UPDATE rooms SET status = $1 WHERE id = $2', ['Dirty', room_id]);
    } else if (status === 'Confirmed') {
      // Optional: Reset if moved back to confirmed? Or assume 'Clean'/'Inspected' if not occupied?
      // For now, let's leave it as is to avoid overwriting housekeeping flows inadvertently.
    }



    // System Log
    if (modified_by) {
      await logSystemEvent(
        db,
        'INFO',
        `Reservation updated by ${modifier_name || 'Staff'}: ${guestName} (${status})`,
        'RESERVATION',
        'RESERVATION_UPDATE',
        property_id,
        modified_by,
        { reservation_id: id, status, total_price }
      );
    }

    await db.query('COMMIT');
    res.status(200).json(rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a reservation
// @route   DELETE /api/reservations/:id
// @access  Public
const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { modified_by, modifier_name } = req.query; // Get from query params for DELETE

    await db.query('BEGIN');

    const { rowCount } = await db.query('DELETE FROM Reservations WHERE id = $1', [id]);
    if (rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Delete from bookings
    await db.query('DELETE FROM bookings WHERE channel_booking_id = $1', [`local_${id}`]);

    // System Log
    if (modified_by) {
      await logSystemEvent(
        db,
        'WARNING',
        `Reservation deleted by ${modifier_name || 'Staff'} (ID: ${id})`,
        'RESERVATION',
        'RESERVATION_DELETE',
        null, // Property ID might be hard to get if we deleted it, but we could fetch before delete if needed. efficient for now to omit or modify flow. 
        modified_by,
        { reservation_id: id }
      );
    }

    await db.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
};
