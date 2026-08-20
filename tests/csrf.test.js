const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('CSRF protection', () => {
  let app;
  let agent;

  beforeAll(async () => {
    ({ app } = await buildTestApp());
  });

  beforeEach(() => {
    agent = request.agent(app);
  });

  test('a POST without a token is rejected', async () => {
    const res = await agent
      .post('/contact')
      .type('form')
      .send({ name: 'Attacker', email: 'attacker@example.com', message: 'forged, no token' });

    expect(res.status).toBe(403);
    expect(res.text).toContain('Form expired');
  });

  test('a POST with a garbage token is rejected', async () => {
    const res = await agent
      .post('/contact')
      .type('form')
      .send({ _csrf: 'not-a-real-token', name: 'Attacker', email: 'attacker@example.com', message: 'forged, bad token' });

    expect(res.status).toBe(403);
  });

  test('a token from a different session (no matching cookie) is rejected', async () => {
    // Mint a real token on one agent (sets its own cookie)...
    const page = await agent.get('/contact');
    const stolenToken = extractCsrfToken(page.text);

    // ...then try to spend it from a client with no cookies at all.
    const res = await request(app)
      .post('/contact')
      .type('form')
      .send({ _csrf: stolenToken, name: 'Attacker', email: 'attacker@example.com', message: 'forged, stolen token' });

    expect(res.status).toBe(403);
  });

  test('a POST with the matching token and cookie succeeds', async () => {
    const page = await agent.get('/contact');
    const token = extractCsrfToken(page.text);

    const res = await agent
      .post('/contact')
      .type('form')
      .send({ _csrf: token, name: 'Real Person', email: 'real@example.com', message: 'a genuine message' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/contact?sent=1');
  });

  test('the Chapa webhook is exempt from CSRF (server-to-server, no cookies)', async () => {
    const res = await request(app)
      .post('/order/webhook')
      .send({ tx_ref: 'nonexistent-ref' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});
