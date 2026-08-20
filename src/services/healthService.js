const fs = require('fs');
const path = require('path');
const { sequelize, Booking, ContactMessage, Customer, Order } = require('../models');
const pkg = require('../../package.json');

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    return { ok: true, message: 'Connected' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

function getLatestBackup() {
  const dir = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
  if (!fs.existsSync(dir)) return null;

  const entries = fs
    .readdirSync(dir)
    .map((name) => ({ name, time: fs.statSync(path.join(dir, name)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  return entries[0] || null;
}

function getUploadsSize() {
  const dir = path.join(__dirname, '..', 'public', 'uploads');
  if (!fs.existsSync(dir)) return 0;

  return fs.readdirSync(dir).reduce((total, name) => {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    return total + (stat.isFile() ? stat.size : 0);
  }, 0);
}

async function getHealth() {
  const [database, pendingBookings, unreadMessages, totalCustomers, totalOrders] = await Promise.all([
    checkDatabase(),
    Booking.count({ where: { status: 'pending' } }),
    ContactMessage.count({ where: { isRead: false } }),
    Customer.count(),
    Order.count(),
  ]);

  const latestBackup = getLatestBackup();

  return {
    database,
    nodeVersion: process.version,
    appVersion: pkg.version,
    env: process.env.NODE_ENV || 'development',
    uptime: formatUptime(process.uptime()),
    memory: formatBytes(process.memoryUsage().rss),
    smtpConfigured: !!process.env.SMTP_HOST,
    chapaConfigured: !!process.env.CHAPA_SECRET_KEY,
    analyticsConfigured: !!process.env.GA_MEASUREMENT_ID,
    backupEnabled: process.env.BACKUP_ENABLED === 'true',
    latestBackup: latestBackup ? { name: latestBackup.name, date: new Date(latestBackup.time) } : null,
    uploadsSize: formatBytes(getUploadsSize()),
    pendingBookings,
    unreadMessages,
    totalCustomers,
    totalOrders,
  };
}

module.exports = { getHealth };
