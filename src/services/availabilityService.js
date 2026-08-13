const { Op } = require('sequelize');
const { Booking } = require('../models');
const bookingConfig = require('../config/booking');

function parseDateOnly(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function buildSlotsForDate(dateStr) {
  const day = parseDateOnly(dateStr);
  const slots = [];

  if (bookingConfig.closedWeekdays.includes(day.getDay())) {
    return slots;
  }

  const slotMs = bookingConfig.slotMinutes * 60 * 1000;
  let cursor = new Date(day);
  cursor.setHours(bookingConfig.openHour, 0, 0, 0);

  const closeTime = new Date(day);
  closeTime.setHours(bookingConfig.closeHour, 0, 0, 0);

  while (cursor.getTime() + slotMs <= closeTime.getTime()) {
    const startsAt = new Date(cursor);
    const endsAt = new Date(cursor.getTime() + slotMs);
    slots.push({ startsAt, endsAt });
    cursor = endsAt;
  }

  return slots;
}

/**
 * Returns slots for a date annotated with status: 'available' | 'pending' | 'booked' | 'past'
 */
async function getAvailabilityForDate(dateStr) {
  const slots = buildSlotsForDate(dateStr);
  if (slots.length === 0) return [];

  const dayStart = slots[0].startsAt;
  const dayEnd = slots[slots.length - 1].endsAt;

  const bookings = await Booking.findAll({
    where: {
      status: { [Op.in]: ['pending', 'confirmed'] },
      startsAt: { [Op.lt]: dayEnd },
      endsAt: { [Op.gt]: dayStart },
    },
  });

  const now = new Date();

  return slots.map((slot) => {
    const overlapping = bookings.find(
      (b) => b.startsAt < slot.endsAt && b.endsAt > slot.startsAt
    );

    let status = 'available';
    if (slot.startsAt < now) {
      status = 'past';
    } else if (overlapping) {
      status = overlapping.status === 'confirmed' ? 'booked' : 'pending';
    }

    return { ...slot, status };
  });
}

/**
 * Throws if the requested slot conflicts with an existing pending/confirmed booking.
 */
async function assertSlotIsFree(startsAt, endsAt) {
  const conflict = await Booking.findOne({
    where: {
      status: { [Op.in]: ['pending', 'confirmed'] },
      startsAt: { [Op.lt]: endsAt },
      endsAt: { [Op.gt]: startsAt },
    },
  });

  if (conflict) {
    const err = new Error('That time slot is no longer available. Please choose another.');
    err.status = 409;
    throw err;
  }
}

module.exports = { buildSlotsForDate, getAvailabilityForDate, assertSlotIsFree };
