const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Booking, Order, Fabric, DesignOption, GalleryImage, ContactMessage, User, Page, Customer, NewsletterSubscriber } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { doubleCsrfProtection } = require('../middleware/csrf');
const upload = require('../middleware/upload');
const videoUpload = require('../middleware/videoUpload');
const bookingConfig = require('../config/booking');
const settingsService = require('../services/settingsService');
const notifications = require('../services/notifications');
const notificationService = require('../services/notificationService');
const { markOrderGroupPaid } = require('../services/orderPaymentService');
const stockService = require('../services/stockService');
const emailService = require('../services/emailService');
const membershipService = require('../services/membershipService');
const analyticsService = require('../services/analyticsService');
const healthService = require('../services/healthService');

const router = express.Router();

router.use('/admin', requireAdmin);

router.get('/admin', async (req, res, next) => {
  try {
    const [pendingBookings, pendingOrders, unreadMessages] = await Promise.all([
      Booking.count({ where: { status: 'pending' } }),
      Order.count({ where: { status: 'paid' } }),
      ContactMessage.count({ where: { isRead: false } }),
    ]);

    const upcoming = await Booking.findAll({
      where: { status: 'confirmed', startsAt: { [Op.gte]: new Date() } },
      order: [['startsAt', 'ASC']],
      limit: 5,
    });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      layout: 'layouts/admin',
      pendingBookings,
      pendingOrders,
      unreadMessages,
      upcoming,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Bookings ----------

router.get('/admin/bookings', async (req, res, next) => {
  try {
    const status = ['pending', 'confirmed', 'rejected', 'expired', 'cancelled'].includes(req.query.status)
      ? req.query.status
      : 'pending';

    const bookings = await Booking.findAll({
      where: { status },
      order: [['startsAt', 'ASC']],
    });

    res.render('admin/bookings', {
      title: 'Bookings — Admin',
      layout: 'layouts/admin',
      bookings,
      status,
      holdHours: bookingConfig.holdHours,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/bookings/:id/approve', async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return res.redirect('/admin/bookings');

    if (booking.status !== 'pending') {
      return res.redirect('/admin/bookings?status=' + booking.status);
    }

    const conflict = await Booking.findOne({
      where: {
        id: { [Op.ne]: booking.id },
        status: 'confirmed',
        startsAt: { [Op.lt]: booking.endsAt },
        endsAt: { [Op.gt]: booking.startsAt },
      },
    });

    if (conflict) {
      req.session.flashError = 'That time was already confirmed for another customer. Reject or reschedule this request.';
      return res.redirect('/admin/bookings');
    }

    booking.status = 'confirmed';
    booking.holdExpiresAt = null;
    await booking.save();
    notifications.sendBookingApproved(booking).catch(() => {});
    notificationService
      .notifyCustomer(booking.customerId, {
        type: 'booking_approved',
        title: 'Appointment confirmed',
        body: `Your ${booking.serviceType} on ${new Date(booking.startsAt).toLocaleString()} is confirmed.`,
        link: '/account/bookings',
      })
      .catch(() => {});
    res.redirect('/admin/bookings');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/bookings/:id/reject', async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (booking && booking.status === 'pending') {
      booking.status = 'rejected';
      booking.holdExpiresAt = null;
      await booking.save();
      notifications.sendBookingRejected(booking).catch(() => {});
      notificationService
        .notifyCustomer(booking.customerId, {
          type: 'booking_rejected',
          title: 'Appointment request declined',
          body: `We're unable to confirm your ${booking.serviceType} request for ${new Date(booking.startsAt).toLocaleString()}.`,
          link: '/account/bookings',
        })
        .catch(() => {});
    }
    res.redirect('/admin/bookings');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/bookings/:id/cancel', async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (booking && booking.status === 'confirmed') {
      booking.status = 'cancelled';
      await booking.save();
    }
    res.redirect('/admin/bookings?status=confirmed');
  } catch (err) {
    next(err);
  }
});

// ---------- Orders ----------

router.get('/admin/orders', async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      include: [Fabric],
      order: [['createdAt', 'DESC']],
    });
    res.render('admin/orders', { title: 'Orders — Admin', layout: 'layouts/admin', orders });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/orders/:id', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [Fabric] });
    if (!order) return res.status(404).render('errors/404', { title: 'Not found' });
    res.render('admin/order-detail', { title: `Order ${order.orderNumber} — Admin`, layout: 'layouts/admin', order });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/orders/:id/status', async (req, res, next) => {
  try {
    const allowed = ['in_production', 'ready', 'completed', 'cancelled'];
    const order = await Order.findByPk(req.params.id);
    if (order && allowed.includes(req.body.status)) {
      order.status = req.body.status;
      await order.save();
      notifications.sendOrderStatusChanged(order).catch(() => {});
      notificationService
        .notifyCustomer(order.customerId, {
          type: 'order_status',
          title: `Order ${order.orderNumber} updated`,
          body: `Your order status is now: ${order.status.replace(/_/g, ' ')}.`,
          link: '/account/orders',
        })
        .catch(() => {});
    }
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

router.post('/admin/orders/:id/mark-cash-paid', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order && order.paymentMethod === 'cash' && order.paymentStatus !== 'paid') {
      await markOrderGroupPaid(order.chapaTxRef);
    }
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

router.post('/admin/orders/:id/receipt-status', async (req, res, next) => {
  try {
    const allowed = ['paid', 'unpaid', 'invalid_receipt'];
    const order = await Order.findByPk(req.params.id);
    if (!order || order.paymentMethod !== 'bank_transfer' || !allowed.includes(req.body.receiptStatus)) {
      return res.redirect(`/admin/orders/${req.params.id}`);
    }

    if (req.body.receiptStatus === 'paid') {
      await markOrderGroupPaid(order.chapaTxRef);
      await Order.update({ receiptStatus: 'paid' }, { where: { chapaTxRef: order.chapaTxRef } });
    } else {
      await Order.update({ receiptStatus: req.body.receiptStatus }, { where: { chapaTxRef: order.chapaTxRef } });
      notificationService
        .notifyCustomer(order.customerId, {
          type: 'receipt_rejected',
          title: `Order ${order.orderNumber}: receipt needs another look`,
          body:
            req.body.receiptStatus === 'invalid_receipt'
              ? "We couldn't validate your receipt — please upload a clearer one."
              : "We couldn't confirm payment from your receipt — please double-check and re-upload.",
          link: `/order/confirmation/${order.chapaTxRef}`,
        })
        .catch(() => {});
    }

    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// ---------- Gallery ----------

router.get('/admin/gallery', async (req, res, next) => {
  try {
    const images = await GalleryImage.findAll({ order: [['sortOrder', 'ASC']] });
    res.render('admin/gallery', { title: 'Gallery — Admin', layout: 'layouts/admin', images });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/gallery', upload.single('image'), doubleCsrfProtection, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.redirect('/admin/gallery');
    }
    const count = await GalleryImage.count();
    await GalleryImage.create({
      title: req.body.title || null,
      category: req.body.category || null,
      imageUrl: `/uploads/${req.file.filename}`,
      sortOrder: count + 1,
    });
    res.redirect('/admin/gallery');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/gallery/:id/delete', async (req, res, next) => {
  try {
    const image = await GalleryImage.findByPk(req.params.id);
    if (image) {
      if (image.imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', 'public', image.imageUrl);
        fs.unlink(filePath, () => {});
      }
      await image.destroy();
    }
    res.redirect('/admin/gallery');
  } catch (err) {
    next(err);
  }
});

// ---------- Fabrics ----------

router.get('/admin/fabrics', async (req, res, next) => {
  try {
    const fabrics = await Fabric.findAll({ order: [['sortOrder', 'ASC']] });
    res.render('admin/fabrics', { title: 'Fabrics — Admin', layout: 'layouts/admin', fabrics });
  } catch (err) {
    next(err);
  }
});

function parseStockQuantity(raw) {
  if (raw === undefined || raw === null || raw.trim() === '') return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : Math.max(0, parsed);
}

router.post('/admin/fabrics', upload.single('image'), doubleCsrfProtection, async (req, res, next) => {
  try {
    const count = await Fabric.count();
    const stockQuantity = parseStockQuantity(req.body.stockQuantity);
    await Fabric.create({
      name: req.body.name,
      description: req.body.description || null,
      material: req.body.material || null,
      color: req.body.color || null,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      priceCents: Math.round(parseFloat(req.body.price || '0') * 100),
      stockQuantity,
      inStock: stockQuantity !== 0,
      sortOrder: count + 1,
    });
    res.redirect('/admin/fabrics');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/fabrics/:id/edit', async (req, res, next) => {
  try {
    const fabric = await Fabric.findByPk(req.params.id);
    if (!fabric) return res.status(404).render('errors/404', { title: 'Not found' });
    res.render('admin/fabric-edit', { title: 'Edit Fabric — Admin', layout: 'layouts/admin', fabric, error: null });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/fabrics/:id/edit', upload.single('image'), doubleCsrfProtection, async (req, res, next) => {
  try {
    const fabric = await Fabric.findByPk(req.params.id);
    if (!fabric) return res.status(404).render('errors/404', { title: 'Not found' });

    fabric.name = req.body.name;
    fabric.description = req.body.description || null;
    fabric.material = req.body.material || null;
    fabric.color = req.body.color || null;
    fabric.priceCents = Math.round(parseFloat(req.body.price || '0') * 100);
    const stockQuantity = parseStockQuantity(req.body.stockQuantity);
    fabric.stockQuantity = stockQuantity;

    if (req.file) {
      const previousUrl = fabric.imageUrl;
      fabric.imageUrl = `/uploads/${req.file.filename}`;
      if (previousUrl && previousUrl.startsWith('/uploads/')) {
        fs.unlink(path.join(__dirname, '..', 'public', previousUrl), () => {});
      }
    }

    if (stockQuantity === 0) {
      await stockService.markOutOfStock(fabric);
    } else {
      if (stockQuantity !== null) fabric.inStock = true;
      await fabric.save();
    }

    res.redirect('/admin/fabrics');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/fabrics/:id/toggle-stock', async (req, res, next) => {
  try {
    const fabric = await Fabric.findByPk(req.params.id);
    if (fabric) {
      if (fabric.inStock) {
        await stockService.markOutOfStock(fabric);
      } else {
        fabric.inStock = true;
        await fabric.save();
      }
    }
    res.redirect('/admin/fabrics');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/fabrics/:id/delete', async (req, res, next) => {
  try {
    await Fabric.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/fabrics');
  } catch (err) {
    next(err);
  }
});

// ---------- Design options ----------

router.get('/admin/design-options', async (req, res, next) => {
  try {
    const options = await DesignOption.findAll({ order: [['category', 'ASC'], ['sortOrder', 'ASC']] });
    res.render('admin/design-options', { title: 'Design Options — Admin', layout: 'layouts/admin', options });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/design-options', upload.single('image'), doubleCsrfProtection, async (req, res, next) => {
  try {
    const count = await DesignOption.count({ where: { category: req.body.category } });
    await DesignOption.create({
      category: req.body.category,
      name: req.body.name,
      description: req.body.description || null,
      priceCents: Math.round(parseFloat(req.body.price || '0') * 100),
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      sortOrder: count + 1,
    });
    res.redirect('/admin/design-options');
  } catch (err) {
    next(err);
  }
});

router.get('/admin/design-options/:id/edit', async (req, res, next) => {
  try {
    const option = await DesignOption.findByPk(req.params.id);
    if (!option) return res.status(404).render('errors/404', { title: 'Not found' });
    res.render('admin/design-option-edit', {
      title: 'Edit Design Option — Admin',
      layout: 'layouts/admin',
      option,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/design-options/:id/edit', upload.single('image'), doubleCsrfProtection, async (req, res, next) => {
  try {
    const option = await DesignOption.findByPk(req.params.id);
    if (!option) return res.status(404).render('errors/404', { title: 'Not found' });

    option.category = req.body.category;
    option.name = req.body.name;
    option.description = req.body.description || null;
    option.priceCents = Math.round(parseFloat(req.body.price || '0') * 100);

    if (req.file) {
      const previousUrl = option.imageUrl;
      option.imageUrl = `/uploads/${req.file.filename}`;
      if (previousUrl && previousUrl.startsWith('/uploads/')) {
        fs.unlink(path.join(__dirname, '..', 'public', previousUrl), () => {});
      }
    }

    await option.save();
    res.redirect('/admin/design-options');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/design-options/:id/delete', async (req, res, next) => {
  try {
    await DesignOption.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/design-options');
  } catch (err) {
    next(err);
  }
});

// ---------- Contact messages ----------

router.get('/admin/messages', async (req, res, next) => {
  try {
    const messages = await ContactMessage.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/messages', { title: 'Messages — Admin', layout: 'layouts/admin', messages });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/messages/:id/read', async (req, res, next) => {
  try {
    await ContactMessage.update({ isRead: true }, { where: { id: req.params.id } });
    res.redirect('/admin/messages');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/messages/:id/delete', async (req, res, next) => {
  try {
    await ContactMessage.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/messages');
  } catch (err) {
    next(err);
  }
});

// ---------- Clients ----------

router.get('/admin/clients', async (req, res, next) => {
  try {
    const [customers, tierThresholds] = await Promise.all([
      Customer.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          { model: Booking, attributes: ['id'] },
          { model: Order, attributes: ['id', 'paymentStatus'] },
        ],
      }),
      membershipService.getThresholds(),
    ]);
    res.render('admin/clients', { title: 'Clients — Admin', layout: 'layouts/admin', customers, tierThresholds, membershipService });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/clients/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).render('errors/404', { title: 'Not found' });

    const [bookings, orders, membership] = await Promise.all([
      Booking.findAll({ where: { customerId: customer.id }, order: [['startsAt', 'DESC']] }),
      Order.findAll({ where: { customerId: customer.id }, order: [['createdAt', 'DESC']], include: [Fabric] }),
      membershipService.getTierForCustomer(customer.id),
    ]);

    res.render('admin/client-detail', {
      title: `${customer.name} — Admin`,
      layout: 'layouts/admin',
      customer,
      bookings,
      orders,
      membership,
      error: null,
      reset: req.query.reset === '1',
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/admin/clients/:id/reset-password',
  [body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')],
  async (req, res, next) => {
    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return res.status(404).render('errors/404', { title: 'Not found' });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const [bookings, orders] = await Promise.all([
          Booking.findAll({ where: { customerId: customer.id }, order: [['startsAt', 'DESC']] }),
          Order.findAll({ where: { customerId: customer.id }, order: [['createdAt', 'DESC']], include: [Fabric] }),
        ]);
        return res.status(400).render('admin/client-detail', {
          title: `${customer.name} — Admin`,
          layout: 'layouts/admin',
          customer,
          bookings,
          orders,
          error: errors.array()[0].msg,
          reset: false,
        });
      }

      customer.passwordHash = await bcrypt.hash(req.body.password, 10);
      await customer.save();
      res.redirect(`/admin/clients/${customer.id}?reset=1`);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/admin/clients/:id/delete', async (req, res, next) => {
  try {
    await Customer.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/clients');
  } catch (err) {
    next(err);
  }
});

// ---------- Newsletter ----------

router.get('/admin/newsletter', async (req, res, next) => {
  try {
    const subscribers = await NewsletterSubscriber.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/newsletter', {
      title: 'Newsletter — Admin',
      layout: 'layouts/admin',
      subscribers,
      activeCount: subscribers.filter((s) => s.subscribed).length,
      sent: req.query.sent || null,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/newsletter/export.csv', async (req, res, next) => {
  try {
    const subscribers = await NewsletterSubscriber.findAll({ where: { subscribed: true }, order: [['createdAt', 'ASC']] });
    const rows = ['email,source,joined'];
    subscribers.forEach((s) => {
      rows.push(`${s.email},${s.source || ''},${s.createdAt.toISOString()}`);
    });
    res.type('text/csv').set('Content-Disposition', 'attachment; filename="newsletter-subscribers.csv"').send(rows.join('\n'));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/admin/newsletter/send',
  [
    body('subject').trim().notEmpty().withMessage('Please enter a subject.'),
    body('bodyHtml').trim().notEmpty().withMessage('Please enter a message.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.redirect('/admin/newsletter?sent=error');
      }

      const subscribers = await NewsletterSubscriber.findAll({ where: { subscribed: true } });
      const { subject, bodyHtml } = req.body;

      // Sequential, not Promise.all — this can be a real batch of emails and
      // there's no reason to hammer the SMTP connection all at once.
      for (const subscriber of subscribers) {
        const unsubscribeUrl = `${res.locals.siteBaseUrl}/newsletter/unsubscribe/${subscriber.unsubscribeToken}`;
        // eslint-disable-next-line no-await-in-loop
        await emailService.sendMail({
          to: subscriber.email,
          subject,
          heading: subject,
          bodyHtml: `${bodyHtml}<p style="margin-top:24px;font-size:12px;color:#8a8078;"><a href="${unsubscribeUrl}">Unsubscribe</a> from this newsletter.</p>`,
        });
      }

      res.redirect(`/admin/newsletter?sent=${subscribers.length}`);
    } catch (err) {
      next(err);
    }
  }
);

// ---------- Admin users ----------

router.get('/admin/users', async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['name', 'ASC']] });
    res.render('admin/users', { title: 'Users — Admin', layout: 'layouts/admin', users });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/users/new', (req, res) => {
  res.render('admin/user-form', {
    title: 'Add User — Admin',
    layout: 'layouts/admin',
    user: null,
    errors: [],
    values: {},
  });
});

router.post(
  '/admin/users',
  [
    body('name').trim().notEmpty().withMessage('Please enter a name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('role').isIn(['admin', 'staff']).withMessage('Please choose a valid role.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('admin/user-form', {
        title: 'Add User — Admin',
        layout: 'layouts/admin',
        user: null,
        errors: errors.array(),
        values: req.body,
      });
    }

    try {
      const email = req.body.email.trim().toLowerCase();
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).render('admin/user-form', {
          title: 'Add User — Admin',
          layout: 'layouts/admin',
          user: null,
          errors: [{ msg: 'A user with that email already exists.' }],
          values: req.body,
        });
      }

      await User.create({
        name: req.body.name,
        email,
        role: req.body.role,
        passwordHash: await bcrypt.hash(req.body.password, 10),
      });

      res.redirect('/admin/users');
    } catch (err) {
      next(err);
    }
  }
);

router.get('/admin/users/:id/edit', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).render('errors/404', { title: 'Not found' });
    res.render('admin/user-form', {
      title: 'Edit User — Admin',
      layout: 'layouts/admin',
      user,
      errors: [],
      values: { name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/admin/users/:id/edit',
  [
    body('name').trim().notEmpty().withMessage('Please enter a name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('role').isIn(['admin', 'staff']).withMessage('Please choose a valid role.'),
    body('password').optional({ checkFalsy: true }).isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).render('errors/404', { title: 'Not found' });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render('admin/user-form', {
          title: 'Edit User — Admin',
          layout: 'layouts/admin',
          user,
          errors: errors.array(),
          values: req.body,
        });
      }

      const email = req.body.email.trim().toLowerCase();
      const existing = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } });
      if (existing) {
        return res.status(400).render('admin/user-form', {
          title: 'Edit User — Admin',
          layout: 'layouts/admin',
          user,
          errors: [{ msg: 'A user with that email already exists.' }],
          values: req.body,
        });
      }

      // Demoting/renaming yourself away from admin would lock you out of user
      // management immediately — block it the same way self-delete is blocked.
      if (user.id === req.session.adminUserId && req.body.role !== 'admin') {
        return res.status(400).render('admin/user-form', {
          title: 'Edit User — Admin',
          layout: 'layouts/admin',
          user,
          errors: [{ msg: 'You cannot remove your own admin role.' }],
          values: req.body,
        });
      }

      user.name = req.body.name;
      user.email = email;
      user.role = req.body.role;
      if (req.body.password) {
        user.passwordHash = await bcrypt.hash(req.body.password, 10);
      }
      await user.save();

      // Keep the session's cached copy in sync so the sidebar/name update immediately.
      if (user.id === req.session.adminUserId) {
        req.session.adminUser = { id: user.id, name: user.name, email: user.email, role: user.role };
      }

      res.redirect('/admin/users');
    } catch (err) {
      next(err);
    }
  }
);

router.post('/admin/users/:id/delete', async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    if (targetId === req.session.adminUserId) {
      req.session.flashError = 'You cannot delete your own account while logged in as it.';
      return res.redirect('/admin/users');
    }

    const totalUsers = await User.count();
    if (totalUsers <= 1) {
      req.session.flashError = 'At least one admin user must remain.';
      return res.redirect('/admin/users');
    }

    await User.destroy({ where: { id: targetId } });
    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
});

// ---------- Site health ----------

router.get('/admin/health', async (req, res, next) => {
  try {
    const health = await healthService.getHealth();
    res.render('admin/health', { title: 'Site Health — Admin', layout: 'layouts/admin', health });
  } catch (err) {
    next(err);
  }
});

// ---------- Notifications ----------

router.get('/admin/notifications', async (req, res, next) => {
  try {
    const items = await notificationService.listForAdmin(100);
    res.render('admin/notifications', { title: 'Notifications — Admin', layout: 'layouts/admin', items });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/notifications/:id/read', async (req, res, next) => {
  try {
    await notificationService.markRead(req.params.id, { audience: 'admin' });
    res.redirect('/admin/notifications');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/notifications/read-all', async (req, res, next) => {
  try {
    await notificationService.markAllReadForAdmin();
    res.redirect('/admin/notifications');
  } catch (err) {
    next(err);
  }
});

// ---------- Analytics ----------

router.get('/admin/analytics', async (req, res, next) => {
  try {
    const summary = await analyticsService.getSummary();
    res.render('admin/analytics', { title: 'Analytics — Admin', layout: 'layouts/admin', summary });
  } catch (err) {
    next(err);
  }
});

// ---------- Pages ----------

const PAGE_LABELS = {
  home: 'Home',
  about: 'About',
  bespoke: 'Bespoke',
  gallery: 'Gallery',
  contact: 'Contact',
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  'refund-policy': 'Refund & Return Policy',
};
const LEGAL_PAGE_SLUGS = new Set(['terms', 'privacy', 'refund-policy']);
const PAGE_SLUGS = Object.keys(PAGE_LABELS);

router.get('/admin/pages', async (req, res, next) => {
  try {
    const pages = await Page.findAll({ where: { slug: { [Op.in]: PAGE_SLUGS } } });
    const bySlug = {};
    pages.forEach((p) => {
      bySlug[p.slug] = p;
    });
    const rows = PAGE_SLUGS.map((slug) => ({ slug, label: PAGE_LABELS[slug], page: bySlug[slug] || null }));
    res.render('admin/pages', { title: 'Pages — Admin', layout: 'layouts/admin', rows });
  } catch (err) {
    next(err);
  }
});

router.get('/admin/pages/:slug/edit', async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!PAGE_LABELS[slug]) return res.status(404).render('errors/404', { title: 'Not found' });

    const page = await Page.findOne({ where: { slug } });
    res.render('admin/page-edit', {
      title: `${PAGE_LABELS[slug]} Page — Admin`,
      layout: 'layouts/admin',
      slug,
      label: PAGE_LABELS[slug],
      isLegal: LEGAL_PAGE_SLUGS.has(slug),
      content: page ? page.content : {},
      saved: req.query.saved === '1',
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/pages/:slug/edit', async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!PAGE_LABELS[slug]) return res.status(404).render('errors/404', { title: 'Not found' });

    const [page] = await Page.findOrCreate({ where: { slug }, defaults: { content: {} } });
    const existing = page.content;
    page.content = {
      ...existing,
      seoTitle: (req.body.seoTitle || '').trim(),
      seoDescription: (req.body.seoDescription || '').trim(),
      eyebrow: (req.body.eyebrow || '').trim(),
      heading: (req.body.heading || '').trim(),
      intro: (req.body.intro || '').trim(),
      ...(LEGAL_PAGE_SLUGS.has(slug)
        ? {
            lastUpdated: (req.body.lastUpdated || '').trim(),
            body: req.body.body || '',
          }
        : {}),
    };
    await page.save();

    res.redirect(`/admin/pages/${slug}/edit?saved=1`);
  } catch (err) {
    next(err);
  }
});

router.post('/admin/pages/home/hero-video', (req, res, next) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      return Page.findOne({ where: { slug: 'home' } }).then((page) =>
        res.status(400).render('admin/page-edit', {
          title: 'Home Page — Admin',
          layout: 'layouts/admin',
          slug: 'home',
          label: 'Home',
          isLegal: false,
          content: page ? page.content : {},
          saved: false,
          error: err.message,
        })
      );
    }

    // req.body is only populated once multer (above) has parsed the
    // multipart form, so the CSRF token can only be checked after this point.
    doubleCsrfProtection(req, res, async (csrfErr) => {
      if (csrfErr) return next(csrfErr);

      try {
        if (!req.file) return res.redirect('/admin/pages/home/edit');

        const [page] = await Page.findOrCreate({ where: { slug: 'home' }, defaults: { content: {} } });
        const previousUrl = page.content.heroVideoUrl;
        page.content = { ...page.content, heroVideoUrl: `/uploads/${req.file.filename}` };
        await page.save();

        if (previousUrl && previousUrl.startsWith('/uploads/')) {
          fs.unlink(path.join(__dirname, '..', 'public', previousUrl), () => {});
        }

        res.redirect('/admin/pages/home/edit');
      } catch (err2) {
        next(err2);
      }
    });
  });
});

router.post('/admin/pages/home/hero-video/remove', async (req, res, next) => {
  try {
    const page = await Page.findOne({ where: { slug: 'home' } });
    if (page) {
      const previousUrl = page.content.heroVideoUrl;
      if (previousUrl && previousUrl.startsWith('/uploads/')) {
        fs.unlink(path.join(__dirname, '..', 'public', previousUrl), () => {});
      }
      page.content = { ...page.content, heroVideoUrl: '' };
      await page.save();
    }
    res.redirect('/admin/pages/home/edit');
  } catch (err) {
    next(err);
  }
});

// ---------- Site settings ----------
// (The homepage hero video used to live here — it's now under Pages > Home,
// since it's page content, not site configuration.)

router.get('/admin/settings', async (req, res, next) => {
  try {
    const siteSettings = await settingsService.getSiteSettings();
    res.render('admin/settings', {
      title: 'Settings — Admin',
      layout: 'layouts/admin',
      values: siteSettings,
      saved: req.query.saved === '1',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/settings', async (req, res, next) => {
  try {
    const fields = Object.keys(settingsService.SITE_SETTING_DEFAULTS);
    // Sequential, not Promise.all: these are separate writes to the same
    // key-value table, and firing them concurrently risks lock contention
    // (observed as SQLITE_BUSY under sqlite; unnecessary either way for a
    // handful of small settings writes with no latency requirement).
    for (const key of fields) {
      await settingsService.set(key, (req.body[key] || '').trim());
    }
    res.redirect('/admin/settings?saved=1');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
