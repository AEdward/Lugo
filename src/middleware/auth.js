const { User, Customer } = require('../models');

// Verifies the session's id still corresponds to a real row before letting
// the request through — otherwise a user/customer deleted by an admin while
// they still have an active session would crash every subsequent request
// instead of being cleanly logged out.
async function requireAdmin(req, res, next) {
  try {
    if (req.session && req.session.adminUserId) {
      const exists = await User.count({ where: { id: req.session.adminUserId } });
      if (exists) return next();
    }
  } catch (err) {
    return next(err);
  }
  req.session.adminUserId = null;
  req.session.adminUser = null;
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login');
}

function attachAdminLocals(req, res, next) {
  res.locals.currentAdmin = req.session.adminUser || null;
  next();
}

async function requireCustomer(req, res, next) {
  try {
    if (req.session && req.session.customerId) {
      const exists = await Customer.count({ where: { id: req.session.customerId } });
      if (exists) return next();
    }
  } catch (err) {
    return next(err);
  }
  req.session.customerId = null;
  req.session.customer = null;
  req.session.returnTo = req.originalUrl;
  return res.redirect('/account/login');
}

function attachCustomerLocals(req, res, next) {
  res.locals.currentCustomer = req.session.customer || null;
  next();
}

module.exports = { requireAdmin, attachAdminLocals, requireCustomer, attachCustomerLocals };
