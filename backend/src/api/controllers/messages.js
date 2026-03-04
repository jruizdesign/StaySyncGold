const db = require('../../config/database');

// @desc    Get messages for a specific reservation
// @route   GET /api/messages/:reservation_id
// @access  Private
const getMessages = async (req, res, next) => {
    try {
        const { reservation_id } = req.params;
        const propertyId = req.user.propertyId || req.query.property_id;

        if (!propertyId) {
            return res.status(400).json({ message: 'Property ID is required' });
        }

        const { rows } = await db.query(
            `SELECT m.*, 
              g.first_name as guest_first_name, g.last_name as guest_last_name, 
              u.email as sender_email, u.name as sender_name
       FROM messages m
       LEFT JOIN guests g ON m.guest_id = g.id
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.reservation_id = $1 AND m.property_id = $2
       ORDER BY m.created_at ASC`,
            [reservation_id, propertyId]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Send a message (individual or broadcast)
// @route   POST /api/messages/send
// @access  Private
const sendMessage = async (req, res, next) => {
    const client = await db.pool.connect();
    try {
        // recipients is an array of { reservation_id, guest_id }
        const { recipients, content } = req.body;
        const propertyId = req.user.propertyId;
        const senderId = req.user.id;

        if (!propertyId) {
            return res.status(400).json({ message: 'Property ID is required' });
        }
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ message: 'Recipients array is required' });
        }
        if (!content) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        await client.query('BEGIN');

        const createdMessages = [];
        // Insert a message for each recipient
        for (const recipient of recipients) {
            const { reservation_id, guest_id } = recipient;

            const { rows } = await client.query(
                `INSERT INTO messages (property_id, reservation_id, guest_id, sender_id, content, direction, status)
         VALUES ($1, $2, $3, $4, $5, 'outbound', 'sent')
         RETURNING *`,
                [propertyId, reservation_id, guest_id, senderId, content]
            );

            createdMessages.push(rows[0]);
        }

        // Optional: Log system event for broadcast
        if (recipients.length > 1) {
            await client.query(
                `INSERT INTO system_logs (level, message, type, event, property_id, user_id, details, created_at)
          VALUES ('INFO', $1, 'MESSAGING', 'BROADCAST_SENT', $2, $3, $4, NOW())`,
                [`Broadcast message sent to ${recipients.length} guests`, propertyId, senderId, JSON.stringify({ count: recipients.length })]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ success: true, count: createdMessages.length, messages: createdMessages });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error sending message(s):", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getMessages,
    sendMessage
};
