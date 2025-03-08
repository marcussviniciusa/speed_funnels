/**
 * Middleware to verify if a user has superadmin role
 */
const isSuperAdmin = (req, res, next) => {
  // Check if user exists and has superadmin role
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Requires superadmin privileges.' });
  }
  next();
};

module.exports = {
  isSuperAdmin,
};
