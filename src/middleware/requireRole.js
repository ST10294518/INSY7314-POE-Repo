// Documentation references added during final review (9 November 2026).
// EXP: https://expressjs.com/en/5x/api/
// See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.

function requireRole(...allowedRoles) {
  if (
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => typeof role !== 'string')
  ) {
    throw new Error('At least one valid role is required.');
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.',
      });
    }

    return next();
  };
}

module.exports = requireRole;
