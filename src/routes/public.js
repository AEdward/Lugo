const express = require('express');
const { body, validationResult } = require('express-validator');
const { GalleryImage, ContactMessage } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const featured = await GalleryImage.findAll({ order: [['sortOrder', 'ASC']], limit: 6 });
    res.render('home', { title: 'Lugo Tailoring — Bespoke Luxury Suits', featured });
  } catch (err) {
    next(err);
  }
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About — Lugo Tailoring' });
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
      await ContactMessage.create({ name, email, phone, message });
      res.redirect('/contact?sent=1');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
