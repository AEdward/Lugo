require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');

const { attachAdminLocals, attachCustomerLocals } = require('./middleware/auth');
const { doubleCsrfProtection, attachCsrfToken, invalidCsrfTokenError } = require('./middleware/csrf');
const { generalLimiter } = require('./middleware/rateLimit');
const settingsService = require('./services/settingsService');
const publicRoutes = require('./routes/public');
const bookingRoutes = require('./routes/booking');
const storeRoutes = require('./routes/store');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const adminRoutes = require('./routes/admin');

function buildSessionStore() {
  // Falls back to the default in-memory store (fine for local/dev) if MySQL
  // session storage can't be initialized, e.g. during tests.
  try {
    const MySQLStore = require('express-mysql-session')(session);
    return new MySQLStore({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      createDatabaseTable: true,
    });
  } catch (err) {
    console.warn('[session] falling back to in-memory session store:', err.message);
    return undefined;
  }
}

function createApp() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(expressLayouts);
  app.set('layout', 'layouts/main');

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  app.use(generalLimiter);

  // Set before session/auth middleware so error pages can render even if
  // something downstream (e.g. the session store) fails.
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.cartCount = 0;
    res.locals.currentAdmin = null;
    res.locals.currentCustomer = null;
    res.locals.flashError = null;
    // Public pages only (layouts/admin.ejs doesn't include the analytics partial).
    res.locals.gaMeasurementId = process.env.GA_MEASUREMENT_ID || null;
    res.locals.siteBaseUrl = (process.env.BASE_URL || '').replace(/\/$/, '');
    // Placeholder so error pages never crash on a missing siteSettings even if
    // something downstream fails before the real lookup below runs; overwritten
    // with the actual DB-backed values further down once session is available.
    res.locals.siteSettings = settingsService.SITE_SETTING_DEFAULTS;
    next();
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
      resave: false,
      // Must persist from the very first request (not just once something is
      // written to the session) — CSRF token validation is keyed to the
      // session id, so it needs to stay stable between the GET that renders
      // a form and the POST that submits it, even for a first-time visitor.
      saveUninitialized: true,
      store: process.env.NODE_ENV === 'test' ? undefined : buildSessionStore(),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  // Multipart forms aren't parsed into req.body until multer runs, which
  // happens per-route (after this point) — those routes re-run
  // doubleCsrfProtection themselves once the body is available.
  app.use((req, res, next) => {
    if (req.is('multipart/form-data')) return next();
    return doubleCsrfProtection(req, res, next);
  });
  app.use(attachCsrfToken);

  app.use(attachAdminLocals);
  app.use(attachCustomerLocals);
  app.use((req, res, next) => {
    res.locals.cartCount = (req.session.cart || []).length;
    res.locals.flashError = req.session.flashError || null;
    delete req.session.flashError;
    next();
  });
  app.use(async (req, res, next) => {
    try {
      res.locals.siteSettings = await settingsService.getSiteSettings();
    } catch (err) {
      res.locals.siteSettings = settingsService.SITE_SETTING_DEFAULTS;
    }
    next();
  });

  app.use(publicRoutes);
  app.use(bookingRoutes);
  app.use(storeRoutes);
  app.use(authRoutes);
  app.use(accountRoutes);
  app.use(adminRoutes);

  app.use((req, res) => {
    res.status(404).render('errors/404', { title: 'Page not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err === invalidCsrfTokenError) {
      return res.status(403).render('errors/500', {
        title: 'Form expired',
        message: 'Your form session expired or was already submitted. Please go back and try again.',
      });
    }
    console.error(err);
    res.status(err.status || 500).render('errors/500', {
      title: 'Something went wrong',
      message: process.env.NODE_ENV === 'production' ? null : err.message,
    });
  });

  return app;
}

module.exports = createApp;
