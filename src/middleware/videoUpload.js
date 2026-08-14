const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const ALLOWED = new Set(['.mp4', '.webm']);

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.has(ext)) {
    return cb(new Error('Unsupported video type. Use MP4 or WebM.'));
  }
  cb(null, true);
}

const videoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = videoUpload;
