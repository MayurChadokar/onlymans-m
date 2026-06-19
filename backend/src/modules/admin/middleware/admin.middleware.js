const authenticate = require('../../auth/middleware/auth.middleware');

/**
 * Admin-only access middleware
 * Must be used AFTER the authenticate middleware
 * Checks if the authenticated user has ADMIN role
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      return next(err);
    }

    if (req.user.role !== 'ADMIN') {
      const err = new Error('Forbidden: Admin access required');
      err.statusCode = 403;
      return next(err);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  requireAdmin,
};
