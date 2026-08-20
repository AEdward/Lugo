const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('booking', () => {
  let app;

  beforeAll(async () => {
    ({ app } = await buildTestApp());
  });

  test('submitting without required fields re-renders with validation errors', async () => {
    const agent = request.agent(app);
    const page = await agent.get('/booking');
    const token = extractCsrfToken(page.text);

    const res = await agent.post('/booking').type('form').send({ _csrf: token, customerName: '' });
    expect(res.status).toBe(400);
  });

  test('a valid booking request succeeds', async () => {
    const agent = request.agent(app);
    const page = await agent.get('/booking');
    const token = extractCsrfToken(page.text);

    const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const res = await agent.post('/booking').type('form').send({
      _csrf: token,
      customerName: 'Guest Person',
      email: 'guest@example.com',
      phone: '+251911111111',
      serviceType: 'consultation',
      startsAt,
      notes: '',
    });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/booking?submitted=1');
  });

  test('the availability endpoint requires a valid date', async () => {
    const res = await request(app).get('/api/bookings/availability');
    expect(res.status).toBe(400);
  });
});

describe('store', () => {
  let app;
  let fabric;

  beforeAll(async () => {
    ({ app, fabric } = await buildTestApp());
  });

  test('the store lists in-stock fabrics and their product pages render', async () => {
    const list = await request(app).get('/store');
    expect(list.status).toBe(200);
    expect(list.text).toContain(fabric.name);

    const product = await request(app).get(`/store/fabrics/${fabric.id}`);
    expect(product.status).toBe(200);
    expect(product.text).toContain(fabric.name);
  });

  test('adding to cart without measurements re-renders with validation errors', async () => {
    const agent = request.agent(app);
    const page = await agent.get(`/store/fabrics/${fabric.id}`);
    const token = extractCsrfToken(page.text);

    const res = await agent.post(`/store/fabrics/${fabric.id}/add-to-cart`).type('form').send({ _csrf: token });
    expect(res.status).toBe(400);
  });

  test('adding a fully measured item to cart succeeds and shows up on the cart page', async () => {
    const agent = request.agent(app);
    const page = await agent.get(`/store/fabrics/${fabric.id}`);
    const token = extractCsrfToken(page.text);

    const res = await agent
      .post(`/store/fabrics/${fabric.id}/add-to-cart`)
      .type('form')
      .send({
        _csrf: token,
        'measurements[height]': '180',
        'measurements[weight]': '80',
        'measurements[chest]': '100',
        'measurements[waist]': '85',
        'measurements[hips]': '95',
        'measurements[shoulder]': '45',
        'measurements[sleeveLength]': '65',
        'measurements[neck]': '40',
        'measurements[inseam]': '80',
        notes: 'no preference',
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/cart');

    const cart = await agent.get('/cart');
    expect(cart.status).toBe(200);
    expect(cart.text).toContain(fabric.name);
  });

  test('checkout without required fields re-renders with validation errors', async () => {
    const agent = request.agent(app);
    const productPage = await agent.get(`/store/fabrics/${fabric.id}`);
    const addToken = extractCsrfToken(productPage.text);
    await agent
      .post(`/store/fabrics/${fabric.id}/add-to-cart`)
      .type('form')
      .send({
        _csrf: addToken,
        'measurements[height]': '180',
        'measurements[weight]': '80',
        'measurements[chest]': '100',
        'measurements[waist]': '85',
        'measurements[hips]': '95',
        'measurements[shoulder]': '45',
        'measurements[sleeveLength]': '65',
        'measurements[neck]': '40',
        'measurements[inseam]': '80',
      });

    const checkoutPage = await agent.get('/checkout');
    expect(checkoutPage.status).toBe(200);
    const checkoutToken = extractCsrfToken(checkoutPage.text);

    const res = await agent.post('/checkout').type('form').send({ _csrf: checkoutToken, customerName: '' });
    expect(res.status).toBe(400);
  });
});
