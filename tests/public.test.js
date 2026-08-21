const request = require('supertest');
const { buildTestApp } = require('./helpers/app');

describe('public pages', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await buildTestApp());
  });

  test.each([
    ['/', 'Lugo Tailoring'],
    ['/about', 'Tailoring'],
    ['/bespoke', 'Bespoke'],
    ['/gallery', 'Collections'],
    ['/contact', 'Contact'],
    ['/booking', 'Appointment'],
    ['/store', 'Store'],
    ['/terms', 'Terms of Service'],
    ['/privacy', 'Privacy Policy'],
    ['/refund-policy', 'Refund'],
  ])('GET %s renders 200', async (path, expectedText) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(200);
    expect(res.text).toContain(expectedText);
  });

  test('unknown route renders 404', async () => {
    const res = await request(app).get('/this-page-does-not-exist');
    expect(res.status).toBe(404);
  });

  test('every public form embeds a CSRF token', async () => {
    const res = await request(app).get('/contact');
    expect(res.text).toMatch(/name="_csrf" value="[^"]+"/);
  });
});
