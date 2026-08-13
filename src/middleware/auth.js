function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUserId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login');
}

function attachAdminLocals(req, res, next) {
  res.locals.currentAdmin = req.session.adminUser || null;
  next();
}

module.exports = { requireAdmin, attachAdminLocals };
