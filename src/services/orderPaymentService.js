const { Op } = require('sequelize');
const { Order, Fabric } = require('../models');
const notifications = require('./notifications');
const notificationService = require('./notificationService');

// Shared by every path that can settle a group of orders (one checkout's
// worth, all sharing chapaTxRef) as paid: Chapa verification, and admin
// manually marking a cash or bank-transfer order paid. Only the request
// that actually flips a not-yet-paid row sends notifications, so two
// near-simultaneous callers (e.g. webhook + return-redirect) never double-send.
async function markOrderGroupPaid(txRef) {
  const [affectedCount] = await Order.update(
    { paymentStatus: 'paid', status: 'paid' },
    { where: { chapaTxRef: txRef, paymentStatus: { [Op.ne]: 'paid' } } }
  );
  const orders = await Order.findAll({ where: { chapaTxRef: txRef }, include: [Fabric] });

  if (affectedCount > 0 && orders.length > 0) {
    notifications.sendOrdersPaid(orders).catch(() => {});
    notifications.notifyAdminNewOrders(orders).catch(() => {});

    const totalCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
    notificationService
      .notifyAdmin({
        type: 'order_paid',
        title: `New paid order — ${orders[0].customerName}`,
        body: `${orders.length} item(s), ETB ${(totalCents / 100).toLocaleString()}`,
        link: `/admin/orders/${orders[0].id}`,
      })
      .catch(() => {});

    // All items from one checkout share the same customerId (or all guest).
    const customerId = orders[0].customerId;
    if (customerId) {
      notificationService
        .notifyCustomer(customerId, {
          type: 'order_paid',
          title: 'Payment received',
          body: `Your order for ${orders.length} item(s) is confirmed and moving into production.`,
          link: '/account/orders',
        })
        .catch(() => {});
    }
  }

  return orders;
}

module.exports = { markOrderGroupPaid };
