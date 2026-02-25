/**
 * Middleware Admin
 * Vérifie que l'utilisateur connecté a le rôle super_admin
 * Doit être utilisé APRÈS le middleware protect
 */
const adminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === 'super_admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Seuls les super-admins peuvent effectuer cette action.',
    });
  }
};

module.exports = { adminOnly };
