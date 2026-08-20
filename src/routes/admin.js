const express = require('express');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Booking, Order, Fabric, DesignOption, GalleryImage, ContactMessage } = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { doubleCsrfProtection } = require('../middleware/csrf');
const upload = require('../middleware/upload');
const videoUpload = require('../middleware/videoUpload');
const bookingConfig = require('../config/booking');
const settingsService = require('../services/settingsService');
const notifications = require('../services/notifications');

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

router.post('/admin/fabrics', upload.single('image'), doubleCsrfProtection, async (req, res, next) => {
  try {
    const count = await Fabric.count();
    await Fabric.create({
      name: req.body.name,
      description: req.body.description || null,
      material: req.body.material || null,
      color: req.body.color || null,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      priceCents: Math.round(parseFloat(req.body.price || '0') * 100),
      inStock: true,
      sortOrder: count + 1,
    });
    res.redirect('/admin/fabrics');
  } catch (err) {
    next(err);
  }
});

router.post('/admin/fabrics/:id/toggle-stock', async (req, res, next) => {
  try {
    const fabric = await Fabric.findByPk(req.params.id);
    if (fabric) {
      fabric.inStock = !fabric.inStock;
      await fabric.save();
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

// ---------- Site settings ----------

router.get('/admin/settings', async (req, res, next) => {
  try {
    const heroVideoUrl = await settingsService.get('heroVideoUrl');
    res.render('admin/settings', {
      title: 'Settings — Admin',
      layout: 'layouts/admin',
      heroVideoUrl,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/admin/settings/hero-video', (req, res, next) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      return settingsService.get('heroVideoUrl').then((heroVideoUrl) =>
        res.status(400).render('admin/settings', {
          title: 'Settings — Admin',
          layout: 'layouts/admin',
          heroVideoUrl,
          error: err.message,
        })
      );
    }

    // req.body is only populated once multer (above) has parsed the
    // multipart form, so the CSRF token can only be checked after this point.
    doubleCsrfProtection(req, res, async (csrfErr) => {
      if (csrfErr) return next(csrfErr);

      try {
        if (!req.file) return res.redirect('/admin/settings');

        const previousUrl = await settingsService.get('heroVideoUrl');
        await settingsService.set('heroVideoUrl', `/uploads/${req.file.filename}`);

        if (previousUrl && previousUrl.startsWith('/uploads/')) {
          fs.unlink(path.join(__dirname, '..', 'public', previousUrl), () => {});
        }

        res.redirect('/admin/settings');
      } catch (err2) {
        next(err2);
      }
    });
  });
});

router.post('/admin/settings/hero-video/remove', async (req, res, next) => {
  try {
    const previousUrl = await settingsService.get('heroVideoUrl');
    if (previousUrl && previousUrl.startsWith('/uploads/')) {
      fs.unlink(path.join(__dirname, '..', 'public', previousUrl), () => {});
    }
    await settingsService.unset('heroVideoUrl');
    res.redirect('/admin/settings');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
