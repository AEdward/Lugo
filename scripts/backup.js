require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const RETENTION_COUNT = parseInt(process.env.BACKUP_RETENTION_COUNT || '14', 10);
const MYSQLDUMP_PATH = process.env.MYSQLDUMP_PATH || 'mysqldump';
const UPLOADS_DIR = path.join(__dirname, '..', 'src', 'public', 'uploads');

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function backupDatabase() {
  const dbName = process.env.DB_NAME;
  if (!dbName) throw new Error('DB_NAME is not set — cannot back up the database.');

  const outFile = path.join(BACKUP_DIR, `db-${dbName}-${timestamp()}.sql`);
  const args = [
    `--host=${process.env.DB_HOST || '127.0.0.1'}`,
    `--port=${process.env.DB_PORT || 3306}`,
    `--user=${process.env.DB_USER || 'root'}`,
    '--single-transaction',
    '--routines',
    dbName,
  ];
  // Password goes through an env var rather than argv so it never shows up in `ps`.
  const env = { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || '' };

  let stdout;
  try {
    ({ stdout } = await execFileAsync(MYSQLDUMP_PATH, args, { env, maxBuffer: 1024 * 1024 * 200 }));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        `Could not find "${MYSQLDUMP_PATH}" on PATH. On XAMPP (Windows), set MYSQLDUMP_PATH to the full path, ` +
          'e.g. C:\\xampp\\mysql\\bin\\mysqldump.exe — or add that folder to your PATH.'
      );
    }
    throw new Error(`mysqldump failed: ${err.stderr || err.message}`);
  }

  fs.writeFileSync(outFile, stdout);
  return outFile;
}

function backupUploads() {
  if (!fs.existsSync(UPLOADS_DIR) || fs.readdirSync(UPLOADS_DIR).length === 0) return null;

  const outDir = path.join(BACKUP_DIR, `uploads-${timestamp()}`);
  fs.cpSync(UPLOADS_DIR, outDir, { recursive: true });
  return outDir;
}

function pruneOldBackups() {
  const entries = fs
    .readdirSync(BACKUP_DIR)
    .map((name) => ({ name, time: fs.statSync(path.join(BACKUP_DIR, name)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  // Keep the most recent RETENTION_COUNT of each backup type independently.
  ['db-', 'uploads-'].forEach((prefix) => {
    entries
      .filter((e) => e.name.startsWith(prefix))
      .slice(RETENTION_COUNT)
      .forEach((e) => fs.rmSync(path.join(BACKUP_DIR, e.name), { recursive: true, force: true }));
  });
}

async function runBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const dbFile = await backupDatabase();
  console.log(`[backup] Database backed up to ${dbFile}`);

  const uploadsBackup = backupUploads();
  if (uploadsBackup) console.log(`[backup] Uploads backed up to ${uploadsBackup}`);

  pruneOldBackups();
  console.log(`[backup] Retention: keeping the last ${RETENTION_COUNT} of each backup type.`);
}

if (require.main === module) {
  runBackup().catch((err) => {
    console.error('[backup] Failed:', err.message);
    process.exit(1);
  });
}

module.exports = { runBackup, backupDatabase, backupUploads, pruneOldBackups, BACKUP_DIR };
