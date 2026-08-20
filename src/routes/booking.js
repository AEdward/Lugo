const express = require('express');
const { body, validationResult } = require('express-validator');
const { Booking } = require('../models');
const { getAvailabilityForDate, assertSlotIsFree } = require('../services/availabilityService');
const bookingConfig = require('../config/booking');
const notifications = require('../services/notifications');

const router = express.Router();

function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

router.get('/booking', (req, res) => {
  res.render('booking', {
    title: 'Book an Appointment — Lugo Tailoring',
    todayDateStr: todayDateStr(),
    submitted: req.query.submitted === '1',
  });
});

router.get('/api/bookings/availability', async (req, res, next) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required.' });
    }
    const slots = await getAvailabilityForDate(dateStr);
    res.json({
      date: dateStr,
      slotMinutes: bookingConfig.slotMinutes,
      slots: slots.map((s) => ({
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        status: s.status,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/booking',
  [
    body('customerName').trim().notEmpty().withMessage('Please enter your name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('phone').trim().notEmpty().withMessage('Please enter a phone number.'),
    body('serviceType').isIn(['consultation', 'measurement', 'fitting', 'alteration', 'delivery']),
    body('startsAt').notEmpty().withMessage('Please choose a time slot.'),
    body('notes').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('booking', {
        title: 'Book an Appointment — Lugo Tailoring',
        todayDateStr: todayDateStr(),
        submitted: false,
        errors: errors.array(),
        values: req.body,
      });
    }

    try {
      const startsAt = new Date(req.body.startsAt);
      if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) {
        return res.status(400).render('booking', {
          title: 'Book an Appointment — Lugo Tailoring',
          todayDateStr: todayDateStr(),
          submitted: false,
          errors: [{ msg: 'Please choose a valid, upcoming time slot.' }],
          values: req.body,
        });
      }
      const endsAt = new Date(startsAt.getTime() + bookingConfig.slotMinutes * 60 * 1000);

      await assertSlotIsFree(startsAt, endsAt);

      const holdExpiresAt = new Date(Date.now() + bookingConfig.holdHours * 60 * 60 * 1000);

      const booking = await Booking.create({
        customerName: req.body.customerName,
        email: req.body.email,
        phone: req.body.phone,
        serviceType: req.body.serviceType,
        startsAt,
        endsAt,
        notes: req.body.notes || null,
        status: 'pending',
        holdExpiresAt,
      });

      notifications.sendBookingSubmitted(booking).catch(() => {});
      notifications.notifyAdminNewBooking(booking).catch(() => {});

      res.redirect('/booking?submitted=1');
    } catch (err) {
      if (err.status === 409) {
        return res.status(409).render('booking', {
          title: 'Book an Appointment — Lugo Tailoring',
          todayDateStr: todayDateStr(),
          submitted: false,
          errors: [{ msg: err.message }],
          values: req.body,
        });
      }
      next(err);
    }
  }
);

module.exports = router;
