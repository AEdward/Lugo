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

function requireCustomer(req, res, next) {
  if (req.session && req.session.customerId) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/account/login');
}

function attachCustomerLocals(req, res, next) {
  res.locals.currentCustomer = req.session.customer || null;
  next();
}

module.exports = { requireAdmin, attachAdminLocals, requireCustomer, attachCustomerLocals };
