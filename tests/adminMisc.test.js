const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('admin analytics, health, and settings', () => {
  let app;
  let adminPassword;
  let agent;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
    agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await agent.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
  });

  test('analytics page loads and reflects a tracked page view', async () => {
    await request(app).get('/about');

    const res = await agent.get('/admin/analytics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('/about');
  });

  test('the admin dashboard itself is never tracked', async () => {
    const res = await agent.get('/admin/analytics');
    expect(res.text).not.toContain('<td>/admin');
  });

  test('health page loads and reports a connected database', async () => {
    const res = await agent.get('/admin/health');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Connected');
  });

  test('settings save persists and shows up on the public site', async () => {
    const settingsPage = await agent.get('/admin/settings');
    const token = extractCsrfToken(settingsPage.text);

    const res = await agent.post('/admin/settings').type('form').send({
      _csrf: token,
      siteName: 'Test Tailoring Co',
      contactEmail: 'hello@test-tailoring.example',
      contactPhone: '+251900000000',
      contactAddress: '123 Test Street',
      socialFacebook: '',
      socialInstagram: '',
      socialTiktok: '',
    });
    expect(res.status).toBe(302);

    const home = await request(app).get('/');
    expect(home.text).toContain('Test Tailoring Co');
    expect(home.text).toContain('hello@test-tailoring.example');
  });

  test('sitemap.xml and robots.txt are served', async () => {
    const sitemap = await request(app).get('/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(sitemap.text).toContain('<urlset');

    const robots = await request(app).get('/robots.txt');
    expect(robots.status).toBe(200);
    expect(robots.text).toContain('Disallow: /admin');
  });
});
