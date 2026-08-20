const { Fabric } = require('../models');
const notifications = require('./notifications');
const notificationService = require('./notificationService');

// Shared by both the checkout-triggered auto-out-of-stock path and the
// admin's manual "mark out of stock" toggle, so the refill alert only has
// one place it's defined.
async function markOutOfStock(fabric) {
  if (!fabric.inStock) return;

  fabric.inStock = false;
  await fabric.save();

  notifications.notifyAdminOutOfStock(fabric).catch(() => {});
  notificationService
    .notifyAdmin({
      type: 'fabric_out_of_stock',
      title: `Out of stock — ${fabric.name}`,
      body: 'Restock or adjust the quantity to bring it back to the store.',
      link: `/admin/fabrics/${fabric.id}/edit`,
    })
    .catch(() => {});
}

// Decrements stock for each fabric used in a set of just-created order
// items (one order row per cart item), and flips any that hit zero out of
// stock. Fabrics with stockQuantity === null aren't tracked (unlimited).
async function decrementStockForOrders(orders) {
  const counts = new Map();
  orders.forEach((o) => {
    counts.set(o.fabricId, (counts.get(o.fabricId) || 0) + 1);
  });

  for (const [fabricId, count] of counts) {
    const fabric = await Fabric.findByPk(fabricId);
    if (!fabric || fabric.stockQuantity === null || fabric.stockQuantity === undefined) continue;

    fabric.stockQuantity = Math.max(0, fabric.stockQuantity - count);
    await fabric.save();

    if (fabric.stockQuantity === 0) {
      await markOutOfStock(fabric);
    }
  }
}

module.exports = { markOutOfStock, decrementStockForOrders };
