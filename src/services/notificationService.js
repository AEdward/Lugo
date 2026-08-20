const { Notification } = require('../models');

function notifyAdmin({ type, title, body = null, link = null }) {
  return Notification.create({ audience: 'admin', customerId: null, type, title, body, link });
}

function notifyCustomer(customerId, { type, title, body = null, link = null }) {
  if (!customerId) return Promise.resolve(null);
  return Notification.create({ audience: 'customer', customerId, type, title, body, link });
}

function unreadAdminCount() {
  return Notification.count({ where: { audience: 'admin', readAt: null } });
}

function unreadCustomerCount(customerId) {
  if (!customerId) return Promise.resolve(0);
  return Notification.count({ where: { audience: 'customer', customerId, readAt: null } });
}

function listForAdmin(limit = 50) {
  return Notification.findAll({ where: { audience: 'admin' }, order: [['createdAt', 'DESC']], limit });
}

function listForCustomer(customerId, limit = 50) {
  return Notification.findAll({ where: { audience: 'customer', customerId }, order: [['createdAt', 'DESC']], limit });
}

async function markRead(id, scopeWhere) {
  const [count] = await Notification.update({ readAt: new Date() }, { where: { id, ...scopeWhere } });
  return count > 0;
}

function markAllReadForAdmin() {
  return Notification.update({ readAt: new Date() }, { where: { audience: 'admin', readAt: null } });
}

function markAllReadForCustomer(customerId) {
  return Notification.update({ readAt: new Date() }, { where: { audience: 'customer', customerId, readAt: null } });
}

module.exports = {
  notifyAdmin,
  notifyCustomer,
  unreadAdminCount,
  unreadCustomerCount,
  listForAdmin,
  listForCustomer,
  markRead,
  markAllReadForAdmin,
  markAllReadForCustomer,
};
