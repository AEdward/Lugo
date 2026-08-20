const crypto = require('crypto');
const { PageView } = require('../models');

function shouldTrack(req) {
  return (
    req.method === 'GET' &&
    !req.path.startsWith('/admin') &&
    !req.path.startsWith('/uploads') &&
    !req.path.startsWith('/api') &&
    req.path !== '/sitemap.xml' &&
    req.path !== '/robots.txt'
  );
}

// Self-hosted, privacy-first page-view tracking: no third party ever sees
// this traffic, and no raw IP address is stored — visitorHash is a one-way
// hash of (ip + user agent + calendar day), just enough to approximate
// unique visitors without being able to identify or re-track anyone.
function trackPageView(req, res, next) {
  if (shouldTrack(req)) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const day = new Date().toISOString().slice(0, 10);
        const visitorHash = crypto
          .createHash('sha256')
          .update(`${req.ip}|${req.get('user-agent') || ''}|${day}`)
          .digest('hex');

        PageView.create({
          path: req.path,
          referrer: req.get('referer') || null,
          visitorHash,
        }).catch(() => {});
      }
    });
  }
  next();
}

module.exports = trackPageView;
