const { doubleCsrf } = require('csrf-csrf');

const { generateCsrfToken, doubleCsrfProtection, invalidCsrfTokenError } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  getSessionIdentifier: (req) => req.session.id,
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-lugo.csrf' : 'lugo.csrf',
  cookieOptions: {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => req.body && req.body._csrf,
  // The Chapa webhook is a server-to-server callback with no browser session/cookie.
  // (Multipart requests are NOT skipped here — see app.js, which skips the global
  // check for them and lets the affected admin routes re-run doubleCsrfProtection
  // themselves after multer parses the body. Skipping multipart here too would
  // disable CSRF checking for those routes entirely, since this same skip
  // predicate would also apply to that second, post-multer invocation.)
  skipCsrfProtection: (req) => req.path === '/order/webhook',
});

function attachCsrfToken(req, res, next) {
  res.locals.csrfToken = generateCsrfToken(req, res);
  next();
}

module.exports = { doubleCsrfProtection, attachCsrfToken, invalidCsrfTokenError };
