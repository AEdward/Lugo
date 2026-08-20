require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');

const { attachAdminLocals, attachCustomerLocals } = require('./middleware/auth');
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
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

  // Set before session/auth middleware so error pages can render even if
  // something downstream (e.g. the session store) fails.
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.cartCount = 0;
    res.locals.currentAdmin = null;
    res.locals.currentCustomer = null;
    res.locals.flashError = null;
    next();
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
      resave: false,
      saveUninitialized: false,
      store: process.env.NODE_ENV === 'test' ? undefined : buildSessionStore(),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  app.use(attachAdminLocals);
  app.use(attachCustomerLocals);
  app.use((req, res, next) => {
    res.locals.cartCount = (req.session.cart || []).length;
    res.locals.flashError = req.session.flashError || null;
    delete req.session.flashError;
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
    console.error(err);
    res.status(err.status || 500).render('errors/500', {
      title: 'Something went wrong',
      message: process.env.NODE_ENV === 'production' ? null : err.message,
    });
  });

  return app;
}

module.exports = createApp;
