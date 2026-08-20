const cron = require('node-cron');
const { runBackup } = require('../../scripts/backup');

function startBackupJob() {
  if (process.env.BACKUP_ENABLED !== 'true') return;

  const hour = parseInt(process.env.BACKUP_HOUR || '3', 10);
  cron.schedule(`0 ${hour} * * *`, () => {
    runBackup().catch((err) => console.error('[backup] scheduled run failed:', err.message));
  });
  // eslint-disable-next-line no-console
  console.log(`[backup] Scheduled daily backup at ${hour}:00.`);
}

module.exports = { startBackupJob };
