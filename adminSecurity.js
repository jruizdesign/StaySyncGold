/**
 * Middleware to ensure the user has admin privileges.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAdmin = (req, res, next) => {
    // Assumes req.user is populated by previous authentication middleware
    if (req.user && req.user.isAdmin) {
        return next();
    }
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
};

module.exports = { requireAdmin };