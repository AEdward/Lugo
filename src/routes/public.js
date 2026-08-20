const express = require('express');
const { body, validationResult } = require('express-validator');
const { GalleryImage, ContactMessage, Page, Fabric } = require('../models');
const settingsService = require('../services/settingsService');
const notifications = require('../services/notifications');
const notificationService = require('../services/notificationService');
const newsletterService = require('../services/newsletterService');
const { formLimiter } = require('../middleware/rateLimit');
const { buildPageMeta } = require('../services/pageService');

const router = express.Router();

const LEGAL_LAST_UPDATED = 'August 20, 2026';

router.get('/', async (req, res, next) => {
  try {
    const [featured, homePage, legacyHeroVideoUrl] = await Promise.all([
      GalleryImage.findAll({ order: [['sortOrder', 'ASC']], limit: 6 }),
      Page.findOne({ where: { slug: 'home' } }),
      settingsService.get('heroVideoUrl'),
    ]);
    const content = homePage ? homePage.content : {};
    // Sites that uploaded a hero video before Pages existed still have it
    // stored under the old Settings key — fall back to that if Pages has none.
    const heroVideoUrl = content.heroVideoUrl || legacyHeroVideoUrl;

    res.render('home', {
      title: content.seoTitle || 'Lugo Tailoring — Bespoke Luxury Suits',
      pageMeta: buildPageMeta(content, 'Lugo Tailoring — Bespoke Luxury Suits'),
      featured,
      heroVideoUrl,
      content,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/about', async (req, res, next) => {
  try {
    const page = await Page.findOne({ where: { slug: 'about' } });
    const content = page ? page.content : {};
    res.render('about', {
      title: content.seoTitle || 'About — Lugo Tailoring',
      pageMeta: buildPageMeta(content, 'About — Lugo Tailoring'),
      content,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/bespoke', async (req, res, next) => {
  try {
    const page = await Page.findOne({ where: { slug: 'bespoke' } });
    const content = page ? page.content : {};
    res.render('bespoke', {
      title: content.seoTitle || 'Bespoke Tailoring — Lugo Tailoring',
      pageMeta: buildPageMeta(content, 'Bespoke Tailoring — Lugo Tailoring'),
      content,
    });
  } catch (err) {
    next(err);
  }
});

async function renderLegalPage(res, view, slug, fallbackTitle) {
  const page = await Page.findOne({ where: { slug } });
  const content = page ? page.content : {};
  res.render(view, {
    title: content.seoTitle || fallbackTitle,
    pageMeta: buildPageMeta(content, fallbackTitle),
    content,
    lastUpdated: content.lastUpdated || LEGAL_LAST_UPDATED,
  });
}

router.get('/terms', async (req, res, next) => {
  try {
    await renderLegalPage(res, 'legal/terms', 'terms', 'Terms of Service — Lugo Tailoring');
  } catch (err) {
    next(err);
  }
});

router.get('/privacy', async (req, res, next) => {
  try {
    await renderLegalPage(res, 'legal/privacy', 'privacy', 'Privacy Policy — Lugo Tailoring');
  } catch (err) {
    next(err);
  }
});

router.get('/refund-policy', async (req, res, next) => {
  try {
    await renderLegalPage(res, 'legal/refund-policy', 'refund-policy', 'Refund & Return Policy — Lugo Tailoring');
  } catch (err) {
    next(err);
  }
});

router.get('/gallery', async (req, res, next) => {
  try {
    const [images, page] = await Promise.all([
      GalleryImage.findAll({ order: [['sortOrder', 'ASC']] }),
      Page.findOne({ where: { slug: 'gallery' } }),
    ]);
    const content = page ? page.content : {};
    res.render('gallery', {
      title: content.seoTitle || 'Gallery — Lugo Tailoring',
      pageMeta: buildPageMeta(content, 'Gallery — Lugo Tailoring'),
      images,
      content,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/contact', async (req, res, next) => {
  try {
    const page = await Page.findOne({ where: { slug: 'contact' } });
    const content = page ? page.content : {};
    res.render('contact', {
      title: content.seoTitle || 'Contact — Lugo Tailoring',
      pageMeta: buildPageMeta(content, 'Contact — Lugo Tailoring'),
      content,
      values: {},
      errors: [],
      success: req.query.sent === '1',
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/contact',
  formLimiter,
  [
    body('name').trim().notEmpty().withMessage('Please enter your name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('phone').optional({ checkFalsy: true }).trim(),
    body('message').trim().isLength({ min: 5 }).withMessage('Please enter a message.'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const page = await Page.findOne({ where: { slug: 'contact' } });
      const content = page ? page.content : {};
      return res.status(400).render('contact', {
        title: content.seoTitle || 'Contact — Lugo Tailoring',
        pageMeta: buildPageMeta(content, 'Contact — Lugo Tailoring'),
        content,
        values: req.body,
        errors: errors.array(),
        success: false,
      });
    }

    try {
      const { name, email, phone, message } = req.body;
      const contactMessage = await ContactMessage.create({ name, email, phone, message });
      notifications.notifyAdminNewMessage(contactMessage).catch(() => {});
      notificationService
        .notifyAdmin({
          type: 'message_new',
          title: `New message — ${contactMessage.name}`,
          body: contactMessage.message.slice(0, 140),
          link: '/admin/messages',
        })
        .catch(() => {});
      res.redirect('/contact?sent=1');
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/newsletter/subscribe',
  formLimiter,
  [body('email').trim().isEmail().withMessage('Please enter a valid email.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      const redirectBack = req.body.returnTo && req.body.returnTo.startsWith('/') ? req.body.returnTo : '/';
      if (!errors.isEmpty()) {
        return res.redirect(`${redirectBack}${redirectBack.includes('?') ? '&' : '?'}newsletter=error`);
      }
      await newsletterService.subscribe(req.body.email, 'footer');
      res.redirect(`${redirectBack}${redirectBack.includes('?') ? '&' : '?'}newsletter=subscribed`);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/newsletter/unsubscribe/:token', async (req, res, next) => {
  try {
    const subscriber = await newsletterService.unsubscribeByToken(req.params.token);
    res.render('newsletter-unsubscribe', { title: 'Unsubscribed — Lugo Tailoring', found: !!subscriber });
  } catch (err) {
    next(err);
  }
});

const STATIC_SITEMAP_PATHS = ['/', '/about', '/bespoke', '/store', '/gallery', '/booking', '/contact', '/terms', '/privacy', '/refund-policy'];

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /account', `Sitemap: ${res.locals.siteBaseUrl}/sitemap.xml`].join('\n')
  );
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = res.locals.siteBaseUrl;
    const fabrics = await Fabric.findAll({ where: { inStock: true }, attributes: ['id'] });

    const urls = [
      ...STATIC_SITEMAP_PATHS,
      ...fabrics.map((f) => `/store/fabrics/${f.id}`),
    ];

    const body =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n') +
      '\n</urlset>';

    res.type('application/xml').send(body);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
