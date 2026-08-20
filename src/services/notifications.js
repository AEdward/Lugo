const emailService = require('./emailService');

function fmtDateTime(date) {
  return new Date(date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtMoney(cents, currency = 'ETB') {
  return `${currency} ${(cents / 100).toLocaleString()}`;
}

// ---------- Bookings ----------

async function sendBookingSubmitted(booking) {
  return emailService.sendMail({
    to: booking.email,
    subject: 'We received your appointment request',
    heading: 'Request received',
    bodyHtml: `
      <p>Hi ${booking.customerName},</p>
      <p>We've received your ${booking.serviceType} request for <strong>${fmtDateTime(booking.startsAt)}</strong>.</p>
      <p>Your time is held while our team reviews it — you'll get another email as soon as it's confirmed.</p>
    `,
  });
}

async function notifyAdminNewBooking(booking) {
  return emailService.notifyAdmin({
    subject: `New booking request — ${booking.customerName}`,
    heading: 'New booking request',
    bodyHtml: `
      <p><strong>${booking.customerName}</strong> requested a ${booking.serviceType} appointment for <strong>${fmtDateTime(booking.startsAt)}</strong>.</p>
      <p>Email: ${booking.email}<br>Phone: ${booking.phone}</p>
      ${booking.notes ? `<p>Notes: ${booking.notes}</p>` : ''}
      <p>Review it in the <a href="${process.env.BASE_URL}/admin/bookings?status=pending">admin bookings queue</a>.</p>
    `,
  });
}

async function sendBookingApproved(booking) {
  return emailService.sendMail({
    to: booking.email,
    subject: 'Your appointment is confirmed',
    heading: 'Appointment confirmed',
    bodyHtml: `
      <p>Hi ${booking.customerName},</p>
      <p>Your ${booking.serviceType} appointment is confirmed for <strong>${fmtDateTime(booking.startsAt)}</strong>.</p>
      <p>We look forward to seeing you.</p>
    `,
  });
}

async function sendBookingRejected(booking) {
  return emailService.sendMail({
    to: booking.email,
    subject: 'Update on your appointment request',
    heading: 'Unable to confirm that time',
    bodyHtml: `
      <p>Hi ${booking.customerName},</p>
      <p>Unfortunately we're unable to confirm your requested time of ${fmtDateTime(booking.startsAt)}.</p>
      <p>Please <a href="${process.env.BASE_URL}/booking">choose another time</a> that works for you, or reply to this email and we'll help find one.</p>
    `,
  });
}

// ---------- Orders ----------

// `orders` is every Order row created by one checkout (one per cart item,
// sharing a single Chapa transaction) — consolidated into a single email
// per recipient rather than one per line item.
function orderListHtml(orders) {
  return `<ul>${orders
    .map((o) => `<li>${o.orderNumber}${o.Fabric ? ` — ${o.Fabric.name}` : ''} (${fmtMoney(o.totalCents, o.currency)})</li>`)
    .join('')}</ul>`;
}

async function sendOrdersPaid(orders) {
  const first = orders[0];
  const total = orders.reduce((sum, o) => sum + o.totalCents, 0);
  return emailService.sendMail({
    to: first.email,
    subject: `Order confirmed — ${first.orderNumber}`,
    heading: 'Payment received',
    bodyHtml: `
      <p>Hi ${first.customerName},</p>
      <p>We've received your payment — total <strong>${fmtMoney(total, first.currency)}</strong>.</p>
      ${orderListHtml(orders)}
      <p>Our tailors will be in touch to confirm next steps.</p>
    `,
  });
}

async function notifyAdminNewOrders(orders) {
  const first = orders[0];
  const total = orders.reduce((sum, o) => sum + o.totalCents, 0);
  return emailService.notifyAdmin({
    subject: `New paid order — ${first.orderNumber}`,
    heading: 'New paid order',
    bodyHtml: `
      <p><strong>${first.customerName}</strong> paid <strong>${fmtMoney(total, first.currency)}</strong>.</p>
      ${orderListHtml(orders)}
      <p>Email: ${first.email}<br>Phone: ${first.phone}</p>
      <p>View it in the <a href="${process.env.BASE_URL}/admin/orders">admin dashboard</a>.</p>
    `,
  });
}

const STATUS_LABELS = {
  in_production: 'now in production',
  ready: 'ready for pickup',
  completed: 'completed',
  cancelled: 'cancelled',
};

async function sendOrderStatusChanged(order) {
  const label = STATUS_LABELS[order.status] || order.status;
  return emailService.sendMail({
    to: order.email,
    subject: `Order ${order.orderNumber} is ${label}`,
    heading: `Your order is ${label}`,
    bodyHtml: `
      <p>Hi ${order.customerName},</p>
      <p>Your order <strong>${order.orderNumber}</strong> is now <strong>${label}</strong>.</p>
    `,
  });
}

// ---------- Contact ----------

async function notifyAdminNewMessage(message) {
  return emailService.notifyAdmin({
    subject: `New contact message from ${message.name}`,
    heading: 'New contact message',
    bodyHtml: `
      <p><strong>${message.name}</strong> (${message.email}${message.phone ? `, ${message.phone}` : ''}) wrote:</p>
      <p style="white-space:pre-wrap;">${message.message}</p>
      <p>Reply directly to this email, or view it in the <a href="${process.env.BASE_URL}/admin/messages">admin dashboard</a>.</p>
    `,
  });
}

module.exports = {
  sendBookingSubmitted,
  notifyAdminNewBooking,
  sendBookingApproved,
  sendBookingRejected,
  sendOrdersPaid,
  notifyAdminNewOrders,
  sendOrderStatusChanged,
  notifyAdminNewMessage,
};
