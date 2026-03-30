const express = require('express');
const router = express.Router();
const supabase = require('../../config/supabase');

// POST /api/auth/invite
// Protected by 'protect' middleware, meaning req.user is populated.
router.post('/invite', async (req, res) => {
    try {
        const { email, role } = req.body;
        
        // Fetch application user details
        const { data: appUser, error: userError } = await supabase
            .from('users')
            .select('role, property_id')
            .eq('id', req.user.id)
            .single();

        if (userError || !appUser) {
            return res.status(401).json({ error: 'Could not resolve application user.' });
        }

        // Ensure the requesting user has permission (must be owner or manager)
        if (appUser.role !== 'owner' && appUser.role !== 'manager' && appUser.role !== 'admin') {
            return res.status(403).json({ error: 'Only owners and managers can invite staff.' });
        }

        const property_id = appUser.property_id;
        
        if (!email || !role || !property_id) {
            return res.status(400).json({ error: 'Email and role are required, and the inviter must be associated with a property.' });
        }

        // Use the Supabase Service Role client to invite a user securely
        // We pack the property_id and role into user_metadata. Our handle_new_user trigger reads this!
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
            data: {
                property_id: property_id,
                role: role
            }
        });

        if (error) {
            console.error('[Auth Invite]', error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ 
            message: 'Invitation sent successfully.',
            user: data.user
        });
        
    } catch (err) {
        console.error('Error in /api/auth/invite:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
