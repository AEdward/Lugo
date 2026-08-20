const express = require('express');
const { body, validationResult } = require('express-validator');
const { GalleryImage, ContactMessage } = require('../models');
const settingsService = require('../services/settingsService');
const notifications = require('../services/notifications');
const { formLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [featured, heroVideoUrl] = await Promise.all([
      GalleryImage.findAll({ order: [['sortOrder', 'ASC']], limit: 6 }),
      settingsService.get('heroVideoUrl'),
    ]);
    res.render('home', { title: 'Lugo Tailoring — Bespoke Luxury Suits', featured, heroVideoUrl });
  } catch (err) {
    next(err);
  }
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About — Lugo Tailoring' });
});

router.get('/bespoke', (req, res) => {
  res.render('bespoke', { title: 'Bespoke Tailoring — Lugo Tailoring' });
});

router.get('/gallery', async (req, res, next) => {
  try {
    const images = await GalleryImage.findAll({ order: [['sortOrder', 'ASC']] });
    res.render('gallery', { title: 'Gallery — Lugo Tailoring', images });
  } catch (err) {
    next(err);
  }
});

router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact — Lugo Tailoring',
    values: {},
    errors: [],
    success: req.query.sent === '1',
  });
});

router.post(
  '/contact',
  formLimiter,
  [
    body('name').trim().notEmpty().withMessage('Please enter your name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('message').trim().isLength({ min: 5 }).withMessage('Please enter a message.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('contact', {
        title: 'Contact — Lugo Tailoring',
        values: req.body,
        errors: errors.array(),
        success: false,
      });
    }

    try {
      const { name, email, phone, message } = req.body;
      const contactMessage = await ContactMessage.create({ name, email, phone, message });
      notifications.notifyAdminNewMessage(contactMessage).catch(() => {});
      res.redirect('/contact?sent=1');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
