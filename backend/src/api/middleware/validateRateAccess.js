const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const validateRateAccess = async (req, res, next) => {
    try {
        const userId = req.user?.id; // Assuming auth middleware populates this
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Fetch user metadata/role from DB
        const { data: user, error } = await supabase
            .from('users') // Adjust if table name is 'app_users' or similar
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !user) {
            // Fallback: check JWT metadata if available
            // For now, strict check on DB
            return res.status(403).json({ error: 'Access Forbidden: User profile not found' });
        }

        const allowedRoles = ['admin', 'manager', 'owner']; // 'owner' mapped to admin or manager usually

        // Normalize role check
        const userRole = (user.role || '').toLowerCase();

        if (allowedRoles.includes(userRole) || req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json({ error: 'Access Forbidden: Managers/Owners only' });
        }

    } catch (e) {
        console.error("Rate Access Validation Error:", e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = validateRateAccess;
