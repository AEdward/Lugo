const cron = require('node-cron');
const { Op } = require('sequelize');
const { Booking } = require('../models');

async function expireStaleBookings() {
  const now = new Date();
  const [count] = await Booking.update(
    { status: 'expired' },
    {
      where: {
        status: 'pending',
        holdExpiresAt: { [Op.lt]: now },
      },
    }
  );

  if (count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[booking-expiry] Expired ${count} unapproved booking hold(s).`);
  }
}

function startBookingExpiryJob() {
  // Runs every 10 minutes; also run once on boot.
  expireStaleBookings().catch((err) => console.error('[booking-expiry] initial run failed', err));
  cron.schedule('*/10 * * * *', () => {
    expireStaleBookings().catch((err) => console.error('[booking-expiry] failed', err));
  });
}

module.exports = { startBookingExpiryJob, expireStaleBookings };
