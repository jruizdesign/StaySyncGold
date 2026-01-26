const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                console.error("Auth Fail: Token invalid or User not found.", error?.message);
                return res.status(401).json({ success: false, error: 'Not authorized, token failed: ' + (error?.message || 'User not found') });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            console.error("Auth Middleware Exception:", error);
            res.status(401).json({ success: false, error: 'Not authorized: ' + error.message });
        }
    } else {
        res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};

module.exports = { protect };
