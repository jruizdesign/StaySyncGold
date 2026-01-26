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
                console.error("Auth Fail:", error?.message);
                return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, error: 'Not authorized' });
        }
    } else {
        res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};

module.exports = { protect };
