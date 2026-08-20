const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('admin client management', () => {
  let app;
  let adminPassword;
  let admin;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
    admin = request.agent(app);
    const loginPage = await admin.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await admin.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
  });

  async function registerCustomer(email) {
    const agent = request.agent(app);
    const regPage = await agent.get('/account/register');
    const token = extractCsrfToken(regPage.text);
    await agent.post('/account/register').type('form').send({
      _csrf: token,
      name: 'Test Client',
      email,
      password: 'ClientPass123',
      confirmPassword: 'ClientPass123',
    });
    return agent;
  }

  test('client list shows a registered customer', async () => {
    await registerCustomer('list-client@example.com');
    const res = await admin.get('/admin/clients');
    expect(res.status).toBe(200);
    expect(res.text).toContain('list-client@example.com');
  });

  test('admin can reset a client password and the client can log in with it', async () => {
    await registerCustomer('reset-client@example.com');
    const list = await admin.get('/admin/clients');
    const clientId = list.text.match(/\/admin\/clients\/(\d+)/)[1];

    const detail = await admin.get(`/admin/clients/${clientId}`);
    const token = extractCsrfToken(detail.text);
    const resetRes = await admin.post(`/admin/clients/${clientId}/reset-password`).type('form').send({ _csrf: token, password: 'AdminSetPass456' });
    expect(resetRes.status).toBe(302);

    const customer = request.agent(app);
    const loginPage = await customer.get('/account/login');
    const loginToken = extractCsrfToken(loginPage.text);
    const loginRes = await customer.post('/account/login').type('form').send({ _csrf: loginToken, email: 'reset-client@example.com', password: 'AdminSetPass456' });
    expect(loginRes.status).toBe(302);
  });

  test('deleting a client logs out their active session cleanly instead of crashing', async () => {
    const customerAgent = await registerCustomer('delete-client@example.com');

    const list = await admin.get('/admin/clients');
    const idx = list.text.indexOf('delete-client@example.com');
    const rowHtml = list.text.slice(idx, idx + 400);
    const targetId = rowHtml.match(/\/admin\/clients\/(\d+)/)[1];

    const detail = await admin.get(`/admin/clients/${targetId}`);
    const token = extractCsrfToken(detail.text);
    const deleteRes = await admin.post(`/admin/clients/${targetId}/delete`).type('form').send({ _csrf: token });
    expect(deleteRes.status).toBe(302);

    // The now-deleted customer's own session should redirect to login, not 500.
    const dashRes = await customerAgent.get('/account');
    expect(dashRes.status).toBe(302);
    expect(dashRes.headers.location).toBe('/account/login');
  });
});
