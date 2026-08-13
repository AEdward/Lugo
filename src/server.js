require('dotenv').config();

const createApp = require('./app');
const { sequelize } = require('./models');
const { startBookingExpiryJob } = require('./services/bookingExpiryJob');

const PORT = process.env.PORT || 3000;

async function start() {
  await sequelize.authenticate();
  console.log('Database connection established.');

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Lugo Tailoring server running on http://localhost:${PORT}`);
  });

  startBookingExpiryJob();
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
