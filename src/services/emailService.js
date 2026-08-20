const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

let transporter = null;

function getTransporter() {
  if (!emailConfig.host || !emailConfig.user || !emailConfig.password) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: { user: emailConfig.user, pass: emailConfig.password },
    });
  }
  return transporter;
}

function wrapHtml({ heading, bodyHtml }) {
  return `
  <div style="background:#f1e9e1;padding:32px 16px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #e3d8cc;">
      <div style="background:#1e1b1a;padding:24px 32px;">
        <span style="color:#a9776f;font-family:Georgia,serif;font-size:20px;font-weight:700;letter-spacing:1px;">LUGO TAILORING</span>
      </div>
      <div style="padding:32px;color:#1e1b1a;">
        <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px;">${heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#4a433f;">${bodyHtml}</div>
      </div>
      <div style="padding:20px 32px;background:#f1e9e1;font-size:12px;color:#8a8078;">
        Lugo Tailoring &middot; This is an automated message.
      </div>
    </div>
  </div>`;
}

/**
 * Sends an email if SMTP is configured; otherwise logs and no-ops.
 * Never throws — a failed/unconfigured send should never break the
 * booking/order/contact flow that triggered it.
 */
async function sendMail({ to, subject, heading, bodyHtml, text }) {
  const t = getTransporter();

  if (!t) {
    console.warn(`[email] SMTP not configured — skipping "${subject}" to ${to}`);
    return { sent: false };
  }

  try {
    await t.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html: wrapHtml({ heading: heading || subject, bodyHtml }),
      text: text || bodyHtml.replace(/<[^>]+>/g, ''),
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { sent: false, error: err };
  }
}

function notifyAdmin({ subject, heading, bodyHtml }) {
  if (!emailConfig.adminNotificationEmail) {
    console.warn(`[email] No ADMIN_NOTIFICATION_EMAIL/ADMIN_EMAIL set — skipping admin notification "${subject}"`);
    return Promise.resolve({ sent: false });
  }
  return sendMail({ to: emailConfig.adminNotificationEmail, subject, heading, bodyHtml });
}

module.exports = { sendMail, notifyAdmin };
