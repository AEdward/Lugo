require('dotenv').config();

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  define: {
    underscored: true,
  },
};

module.exports = {
  development: base,
  // Automated tests run against an isolated in-memory SQLite database instead
  // of MySQL, so `npm test` works without a database server configured.
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    define: { underscored: true },
    logging: false,
  },
  production: base,
};
