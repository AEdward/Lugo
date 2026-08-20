const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('in-app notifications', () => {
  let app;
  let adminPassword;
  let adminAgent;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
    adminAgent = request.agent(app);
    const loginPage = await adminAgent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await adminAgent.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
  });

  test('a contact form submission creates an admin notification', async () => {
    const anon = request.agent(app);
    const contactPage = await anon.get('/contact');
    const token = extractCsrfToken(contactPage.text);

    await anon.post('/contact').type('form').send({
      _csrf: token,
      name: 'Jane Prospect',
      email: 'jane@example.com',
      message: 'Interested in a bespoke suit.',
    });

    const notifPage = await adminAgent.get('/admin/notifications');
    expect(notifPage.status).toBe(200);
    expect(notifPage.text).toContain('New message — Jane Prospect');
  });

  test('marking a notification read clears the unread badge', async () => {
    const dashBefore = await adminAgent.get('/admin');
    expect(dashBefore.text).toMatch(/Notifications.*badge-rejected">\d+</s);

    const notifPage = await adminAgent.get('/admin/notifications');
    const notifId = notifPage.text.match(/\/admin\/notifications\/(\d+)\/read/)[1];
    const token = extractCsrfToken(notifPage.text);

    const res = await adminAgent.post(`/admin/notifications/${notifId}/read`).type('form').send({ _csrf: token });
    expect(res.status).toBe(302);

    const dashAfter = await adminAgent.get('/admin');
    expect(dashAfter.text).not.toMatch(/Notifications.*badge-rejected"/s);
  });

  test('marking read without a CSRF token is rejected', async () => {
    const res = await adminAgent.post('/admin/notifications/1/read').type('form').send({});
    expect(res.status).toBe(403);
  });

  test('a booking notifies both the admin and, if logged in, the customer — and each side only sees its own', async () => {
    const customer = request.agent(app);
    const regPage = await customer.get('/account/register');
    const regToken = extractCsrfToken(regPage.text);
    await customer.post('/account/register').type('form').send({
      _csrf: regToken,
      name: 'Notif Customer',
      email: 'notifcustomer@example.com',
      password: 'CustomerPass123',
      confirmPassword: 'CustomerPass123',
    });

    const bookingPage = await customer.get('/booking');
    const bookingToken = extractCsrfToken(bookingPage.text);
    const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await customer.post('/booking').type('form').send({
      _csrf: bookingToken,
      customerName: 'Notif Customer',
      email: 'notifcustomer@example.com',
      phone: '+251911111111',
      serviceType: 'consultation',
      startsAt,
    });

    const customerNotifs = await customer.get('/account/notifications');
    expect(customerNotifs.text).toContain('Booking request received');

    const adminNotifs = await adminAgent.get('/admin/notifications');
    expect(adminNotifs.text).toContain('New booking request — Notif Customer');

    // Cross-tenant isolation: the customer's own list never shows the admin's
    // "New booking request" copy, and vice versa.
    expect(customerNotifs.text).not.toContain('New booking request');
    expect(adminNotifs.text).not.toContain('Booking request received');
  });
});
