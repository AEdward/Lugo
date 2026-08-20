const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('admin pages CMS', () => {
  let app;
  let adminPassword;
  let agent;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
  });

  beforeEach(async () => {
    agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await agent.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
  });

  test('editing the home page updates the public homepage and its SEO meta', async () => {
    const editPage = await agent.get('/admin/pages/home/edit');
    expect(editPage.status).toBe(200);
    const token = extractCsrfToken(editPage.text);

    const res = await agent.post('/admin/pages/home/edit').type('form').send({
      _csrf: token,
      eyebrow: 'Custom Eyebrow',
      heading: 'Custom Heading',
      intro: 'Custom intro text.',
      seoTitle: 'Custom SEO Title',
      seoDescription: 'Custom SEO description.',
    });
    expect(res.status).toBe(302);

    const home = await request(app).get('/');
    expect(home.text).toContain('Custom Heading');
    expect(home.text).toContain('Custom intro text.');
    expect(home.text).toContain('<title>Custom SEO Title</title>');
    expect(home.text).toContain('content="Custom SEO description."');
  });

  test('editing a legal page updates its public body and Last Updated date', async () => {
    const editPage = await agent.get('/admin/pages/terms/edit');
    expect(editPage.status).toBe(200);
    expect(editPage.text).toContain('Body (HTML)');
    const token = extractCsrfToken(editPage.text);

    const res = await agent.post('/admin/pages/terms/edit').type('form').send({
      _csrf: token,
      eyebrow: 'Legal',
      heading: 'Terms of Service',
      lastUpdated: 'September 1, 2026',
      body: '<h2>1. Test Section</h2><p>Updated legal text.</p>',
      seoTitle: 'Terms — Test',
      seoDescription: 'Test SEO description.',
    });
    expect(res.status).toBe(302);

    const terms = await request(app).get('/terms');
    expect(terms.text).toContain('Test Section');
    expect(terms.text).toContain('Updated legal text.');
    expect(terms.text).toContain('September 1, 2026');
  });

  test('an unknown page slug 404s', async () => {
    const res = await agent.get('/admin/pages/nonexistent/edit');
    expect(res.status).toBe(404);
  });

  test('hero video upload without a CSRF token is rejected', async () => {
    const res = await agent
      .post('/admin/pages/home/hero-video')
      .attach('video', Buffer.from('fake video bytes'), { filename: 'hero.mp4', contentType: 'video/mp4' });
    expect(res.status).toBe(403);
  });
});
