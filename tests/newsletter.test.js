const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');
const { waitFor } = require('./helpers/waitFor');

describe('newsletter subscribers', () => {
  let app;
  let adminPassword;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
  });

  async function loginAdmin() {
    const admin = request.agent(app);
    const loginPage = await admin.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await admin.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
    return admin;
  }

  test('subscribing via the footer form redirects with a success flag and is idempotent', async () => {
    const visitor = request.agent(app);
    const home = await visitor.get('/');
    const token = extractCsrfToken(home.text);

    const res = await visitor.post('/newsletter/subscribe').type('form').send({ _csrf: token, email: 'fan@example.com' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('newsletter=subscribed');

    const { NewsletterSubscriber } = require('../src/models');
    const count = await NewsletterSubscriber.count({ where: { email: 'fan@example.com' } });
    expect(count).toBe(1);

    // Subscribing again with the same email must not create a duplicate row.
    const home2 = await visitor.get('/');
    const token2 = extractCsrfToken(home2.text);
    await visitor.post('/newsletter/subscribe').type('form').send({ _csrf: token2, email: 'fan@example.com' });
    const countAfter = await NewsletterSubscriber.count({ where: { email: 'fan@example.com' } });
    expect(countAfter).toBe(1);
  });

  test('an unsubscribe link flips a subscriber to unsubscribed', async () => {
    const { NewsletterSubscriber } = require('../src/models');
    const sub = await NewsletterSubscriber.create({
      email: 'leaving@example.com',
      source: 'footer',
      subscribed: true,
      unsubscribeToken: 'test-unsub-token-123',
    });

    const res = await request(app).get(`/newsletter/unsubscribe/${sub.unsubscribeToken}`);
    expect(res.status).toBe(200);
    expect(res.text.toLowerCase()).toContain('unsubscribed');

    const reloaded = await NewsletterSubscriber.findByPk(sub.id);
    expect(reloaded.subscribed).toBe(false);
  });

  test('admin can view subscribers, export CSV, and send a broadcast', async () => {
    const { NewsletterSubscriber } = require('../src/models');
    await NewsletterSubscriber.create({
      email: 'broadcast-target@example.com',
      source: 'checkout',
      subscribed: true,
      unsubscribeToken: 'broadcast-token-456',
    });

    const admin = await loginAdmin();
    const list = await admin.get('/admin/newsletter');
    expect(list.status).toBe(200);
    expect(list.text).toContain('broadcast-target@example.com');

    const csv = await admin.get('/admin/newsletter/export.csv');
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain('broadcast-target@example.com');

    const token = extractCsrfToken(list.text);
    const sendRes = await admin
      .post('/admin/newsletter/send')
      .type('form')
      .send({ _csrf: token, subject: 'Test Subject', bodyHtml: 'Hello subscribers.' });
    expect(sendRes.status).toBe(302);
    expect(sendRes.headers.location).toMatch(/sent=\d+/);
  });

  test('registering with the newsletter checkbox creates a subscriber with source "registration"', async () => {
    const visitor = request.agent(app);
    const regPage = await visitor.get('/account/register');
    const token = extractCsrfToken(regPage.text);

    await visitor.post('/account/register').type('form').send({
      _csrf: token,
      name: 'Newsletter Joiner',
      email: 'joiner@example.com',
      password: 'testpass123',
      confirmPassword: 'testpass123',
      newsletter: 'on',
    });

    // The registration route fires the newsletter opt-in without awaiting it
    // (so the response isn't held up), so poll briefly for the subscriber row.
    const { NewsletterSubscriber } = require('../src/models');
    const sub = await waitFor(() => NewsletterSubscriber.findOne({ where: { email: 'joiner@example.com' } }));
    expect(sub).not.toBeNull();
    expect(sub.source).toBe('registration');
  });
});
