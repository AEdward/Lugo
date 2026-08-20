const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('admin authentication', () => {
  let app;
  let adminPassword;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
  });

  test('the dashboard redirects to login when logged out', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin/login');
  });

  test('login fails with the wrong password', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);

    const res = await agent
      .post('/admin/login')
      .type('form')
      .send({ _csrf: token, email: 'admin@test.local', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('Invalid email or password');
  });

  test('login succeeds with the right credentials and unlocks the dashboard', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);

    const loginRes = await agent
      .post('/admin/login')
      .type('form')
      .send({ _csrf: token, email: 'admin@test.local', password: adminPassword });

    expect(loginRes.status).toBe(302);
    expect(loginRes.headers.location).toBe('/admin');

    const dashboard = await agent.get('/admin');
    expect(dashboard.status).toBe(200);
    expect(dashboard.text).toContain('Dashboard');
  });

  test('logout clears the session and locks the dashboard again', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await agent.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });

    const dashboardBefore = await agent.get('/admin');
    expect(dashboardBefore.status).toBe(200);

    const logoutToken = extractCsrfToken(dashboardBefore.text);
    await agent.post('/admin/logout').type('form').send({ _csrf: logoutToken });

    const dashboardAfter = await agent.get('/admin');
    expect(dashboardAfter.status).toBe(302);
    expect(dashboardAfter.headers.location).toBe('/admin/login');
  });
});
