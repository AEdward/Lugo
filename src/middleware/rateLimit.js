const rateLimit = require('express-rate-limit');

function buildLimiter(windowMs, limit, message) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429);
      if (req.accepts('html')) {
        return res.render('errors/500', { title: 'Too many requests', message });
      }
      res.json({ error: message });
    },
  });
}

// Generous site-wide ceiling to blunt scraping/flood abuse without affecting normal browsing.
const generalLimiter = buildLimiter(
  15 * 60 * 1000,
  300,
  'Too many requests. Please slow down and try again shortly.'
);

// Tight limit on credential-guessing surfaces: admin/customer login, registration, password change.
const authLimiter = buildLimiter(
  15 * 60 * 1000,
  10,
  'Too many attempts. Please wait a few minutes and try again.'
);

// Public forms that create records (contact, booking) — spam/abuse guard.
const formLimiter = buildLimiter(
  15 * 60 * 1000,
  20,
  'Too many submissions. Please wait a few minutes and try again.'
);

// Checkout initiates a real Chapa payment transaction per request.
const checkoutLimiter = buildLimiter(
  15 * 60 * 1000,
  20,
  'Too many checkout attempts. Please wait a few minutes and try again.'
);

module.exports = { generalLimiter, authLimiter, formLimiter, checkoutLimiter };
