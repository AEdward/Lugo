module.exports = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM || 'Lugo Tailoring <no-reply@lugotailoring.com>',
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL,
};
