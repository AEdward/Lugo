const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Customer, Booking, Order, Fabric } = require('../models');
const { requireCustomer } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

function customerSessionPayload(customer) {
  return { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone };
}

// ---------- Register ----------

router.get('/account/register', (req, res) => {
  if (req.session.customerId) return res.redirect('/account');
  res.render('account/register', { title: 'Create Account — Lugo Tailoring', errors: [], values: {} });
});

router.post(
  '/account/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Please enter your name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('account/register', {
        title: 'Create Account — Lugo Tailoring',
        errors: errors.array(),
        values: req.body,
      });
    }

    try {
      const email = req.body.email.trim().toLowerCase();
      const existing = await Customer.findOne({ where: { email } });
      if (existing) {
        return res.status(400).render('account/register', {
          title: 'Create Account — Lugo Tailoring',
          errors: [{ msg: 'An account with that email already exists.' }],
          values: req.body,
        });
      }

      const passwordHash = await bcrypt.hash(req.body.password, 10);
      const customer = await Customer.create({
        name: req.body.name,
        email,
        phone: req.body.phone || null,
        passwordHash,
      });

      req.session.customerId = customer.id;
      req.session.customer = customerSessionPayload(customer);

      const returnTo = req.session.returnTo || '/account';
      delete req.session.returnTo;
      res.redirect(returnTo);
    } catch (err) {
      next(err);
    }
  }
);

// ---------- Login / Logout ----------

router.get('/account/login', (req, res) => {
  if (req.session.customerId) return res.redirect('/account');
  res.render('account/login', { title: 'Log In — Lugo Tailoring', error: null });
});

router.post('/account/login', authLimiter, async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const customer = await Customer.findOne({ where: { email } });
    const valid = customer && (await bcrypt.compare(req.body.password || '', customer.passwordHash));

    if (!valid) {
      return res.status(401).render('account/login', {
        title: 'Log In — Lugo Tailoring',
        error: 'Invalid email or password.',
      });
    }

    req.session.customerId = customer.id;
    req.session.customer = customerSessionPayload(customer);

    const returnTo = req.session.returnTo || '/account';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (err) {
    next(err);
  }
});

router.post('/account/logout', (req, res) => {
  delete req.session.customerId;
  delete req.session.customer;
  res.redirect('/account/login');
});

// ---------- Dashboard ----------

router.get('/account', requireCustomer, async (req, res, next) => {
  try {
    const [upcomingBooking, recentOrder] = await Promise.all([
      Booking.findOne({
        where: { customerId: req.session.customerId, status: 'confirmed', startsAt: { [Op.gte]: new Date() } },
        order: [['startsAt', 'ASC']],
      }),
      Order.findOne({ where: { customerId: req.session.customerId }, order: [['createdAt', 'DESC']], include: [Fabric] }),
    ]);

    res.render('account/dashboard', {
      title: 'My Account — Lugo Tailoring',
      upcomingBooking,
      recentOrder,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/account/bookings', requireCustomer, async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { customerId: req.session.customerId },
      order: [['startsAt', 'DESC']],
    });
    res.render('account/bookings', { title: 'My Bookings — Lugo Tailoring', bookings });
  } catch (err) {
    next(err);
  }
});

router.get('/account/orders', requireCustomer, async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { customerId: req.session.customerId },
      order: [['createdAt', 'DESC']],
      include: [Fabric],
    });
    res.render('account/orders', { title: 'My Orders — Lugo Tailoring', orders });
  } catch (err) {
    next(err);
  }
});

// ---------- Settings ----------

router.get('/account/settings', requireCustomer, (req, res) => {
  res.render('account/settings', {
    title: 'Account Settings — Lugo Tailoring',
    profileErrors: [],
    passwordErrors: [],
    profileSaved: req.query.saved === 'profile',
    passwordSaved: req.query.saved === 'password',
  });
});

router.post(
  '/account/settings',
  requireCustomer,
  [
    body('name').trim().notEmpty().withMessage('Please enter your name.'),
    body('phone').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('account/settings', {
        title: 'Account Settings — Lugo Tailoring',
        profileErrors: errors.array(),
        passwordErrors: [],
        profileSaved: false,
        passwordSaved: false,
      });
    }

    try {
      const customer = await Customer.findByPk(req.session.customerId);
      customer.name = req.body.name;
      customer.phone = req.body.phone || null;
      await customer.save();

      req.session.customer = customerSessionPayload(customer);
      res.redirect('/account/settings?saved=profile');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/account/settings/password',
  requireCustomer,
  authLimiter,
  [
    body('currentPassword').notEmpty().withMessage('Please enter your current password.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
    body('confirmNewPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('New passwords do not match.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('account/settings', {
        title: 'Account Settings — Lugo Tailoring',
        profileErrors: [],
        passwordErrors: errors.array(),
        profileSaved: false,
        passwordSaved: false,
      });
    }

    try {
      const customer = await Customer.findByPk(req.session.customerId);
      const valid = await bcrypt.compare(req.body.currentPassword, customer.passwordHash);

      if (!valid) {
        return res.status(400).render('account/settings', {
          title: 'Account Settings — Lugo Tailoring',
          profileErrors: [],
          passwordErrors: [{ msg: 'Your current password is incorrect.' }],
          profileSaved: false,
          passwordSaved: false,
        });
      }

      customer.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
      await customer.save();
      res.redirect('/account/settings?saved=password');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
