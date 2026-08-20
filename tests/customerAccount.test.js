const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('customer accounts', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await buildTestApp());
  });

  test('the account dashboard redirects to login when logged out', async () => {
    const res = await request(app).get('/account');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/account/login');
  });

  test('register creates an account, logs the customer in, and unlocks the dashboard', async () => {
    const agent = request.agent(app);
    const registerPage = await agent.get('/account/register');
    const token = extractCsrfToken(registerPage.text);

    const res = await agent
      .post('/account/register')
      .type('form')
      .send({
        _csrf: token,
        name: 'Jane Customer',
        email: 'jane@example.com',
        phone: '+251911111111',
        password: 'CustomerPass123',
        confirmPassword: 'CustomerPass123',
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/account');

    const dashboard = await agent.get('/account');
    expect(dashboard.status).toBe(200);
    expect(dashboard.text).toContain('Jane');
  });

  test('register rejects a duplicate email', async () => {
    const agent = request.agent(app);
    const registerPage = await agent.get('/account/register');
    const token = extractCsrfToken(registerPage.text);

    const res = await agent
      .post('/account/register')
      .type('form')
      .send({
        _csrf: token,
        name: 'Jane Again',
        email: 'jane@example.com',
        password: 'CustomerPass123',
        confirmPassword: 'CustomerPass123',
      });

    expect(res.status).toBe(400);
    expect(res.text).toContain('already exists');
  });

  test('login fails with the wrong password, succeeds with the right one', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/account/login');
    const token = extractCsrfToken(loginPage.text);

    const badRes = await agent
      .post('/account/login')
      .type('form')
      .send({ _csrf: token, email: 'jane@example.com', password: 'wrong-password' });
    expect(badRes.status).toBe(401);

    const loginPage2 = await agent.get('/account/login');
    const token2 = extractCsrfToken(loginPage2.text);
    const goodRes = await agent
      .post('/account/login')
      .type('form')
      .send({ _csrf: token2, email: 'jane@example.com', password: 'CustomerPass123' });
    expect(goodRes.status).toBe(302);
    expect(goodRes.headers.location).toBe('/account');
  });

  test('settings: profile update and password change, then logout locks the dashboard', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/account/login');
    const token = extractCsrfToken(loginPage.text);
    await agent.post('/account/login').type('form').send({ _csrf: token, email: 'jane@example.com', password: 'CustomerPass123' });

    const settingsPage = await agent.get('/account/settings');
    const profileToken = extractCsrfToken(settingsPage.text);
    const profileRes = await agent
      .post('/account/settings')
      .type('form')
      .send({ _csrf: profileToken, name: 'Jane C. Updated', phone: '+251922222222' });
    expect(profileRes.status).toBe(302);
    expect(profileRes.headers.location).toBe('/account/settings?saved=profile');

    const settingsPage2 = await agent.get('/account/settings');
    expect(settingsPage2.text).toContain('Jane C. Updated');

    const pwToken = extractCsrfToken(settingsPage2.text);
    const wrongCurrentRes = await agent
      .post('/account/settings/password')
      .type('form')
      .send({ _csrf: pwToken, currentPassword: 'not-the-current-password', newPassword: 'NewCustomerPass456', confirmNewPassword: 'NewCustomerPass456' });
    expect(wrongCurrentRes.status).toBe(400);
    expect(wrongCurrentRes.text).toContain('incorrect');

    const pwPage = await agent.get('/account/settings');
    const pwToken2 = extractCsrfToken(pwPage.text);
    const pwRes = await agent
      .post('/account/settings/password')
      .type('form')
      .send({ _csrf: pwToken2, currentPassword: 'CustomerPass123', newPassword: 'NewCustomerPass456', confirmNewPassword: 'NewCustomerPass456' });
    expect(pwRes.status).toBe(302);
    expect(pwRes.headers.location).toBe('/account/settings?saved=password');

    const logoutPage = await agent.get('/account/settings');
    // Every form on the page carries the same token, so any match works.
    const logoutToken = extractCsrfToken(logoutPage.text);
    await agent.post('/account/logout').type('form').send({ _csrf: logoutToken });

    const dashboardAfter = await agent.get('/account');
    expect(dashboardAfter.status).toBe(302);
    expect(dashboardAfter.headers.location).toBe('/account/login');

    // The new password now works, confirming the change actually persisted.
    const relogin = request.agent(app);
    const relForm = await relogin.get('/account/login');
    const relToken = extractCsrfToken(relForm.text);
    const relRes = await relogin
      .post('/account/login')
      .type('form')
      .send({ _csrf: relToken, email: 'jane@example.com', password: 'NewCustomerPass456' });
    expect(relRes.status).toBe(302);
  });
});
