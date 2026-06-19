const { roleRights, roles } = require('../../../common/roles');

/**
 * requireRole middleware — accepts either:
 *   - Role names: requireRole('CREATOR')  → checks req.user.role === 'CREATOR'
 *   - Permission rights: requireRole('manageContent') → checks roleRights map
 * ADMIN always passes through.
 */
const requireRole = (...requiredRoles) => async (req, res, next) => {
  try {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      return next(err);
    }

    // ADMIN bypasses all role/right checks
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const allRoleNames = Object.values(roles); // ['USER', 'CREATOR', 'ADMIN']
    const userRights = roleRights.get(req.user.role) || [];

    const hasAccess = requiredRoles.every((requiredRoleOrRight) => {
      // If it's a role name (e.g. 'CREATOR'), check req.user.role directly
      if (allRoleNames.includes(requiredRoleOrRight)) {
        return req.user.role === requiredRoleOrRight;
      }
      // Otherwise treat it as a permission right and check the rights map
      return userRights.includes(requiredRoleOrRight);
    });

    if (!hasAccess) {
      const err = new Error('Forbidden: insufficient role or permissions');
      err.statusCode = 403;
      return next(err);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireRole;
