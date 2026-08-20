const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');
const { waitFor } = require('./helpers/waitFor');

async function addToCart(agent, fabricId) {
  const productPage = await agent.get(`/store/fabrics/${fabricId}`);
  const token = extractCsrfToken(productPage.text);
  return agent
    .post(`/store/fabrics/${fabricId}/add-to-cart`)
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
    });
}

describe('fabric stock management', () => {
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

  test('checkout decrements stock quantity and flips a fabric out of stock at zero', async () => {
    const { Fabric } = require('../src/models');
    const fabric = await Fabric.create({
      name: 'Limited Tweed',
      description: 'Only one left.',
      material: 'Tweed',
      color: 'Brown',
      priceCents: 500000,
      inStock: true,
      stockQuantity: 1,
      sortOrder: 99,
    });

    const customer = request.agent(app);
    await addToCart(customer, fabric.id);

    const checkoutPage = await customer.get('/checkout');
    const token = extractCsrfToken(checkoutPage.text);
    const checkoutRes = await customer.post('/checkout').type('form').send({
      _csrf: token,
      customerName: 'Stock Buyer',
      email: 'stockbuyer@example.com',
      phone: '+251933333333',
      paymentMethod: 'cash',
    });
    expect(checkoutRes.status).toBe(302);

    // The checkout route fires decrementStockForOrders without awaiting it
    // (so the response isn't held up), so poll briefly for the update.
    const reloaded = await waitFor(async () => {
      const f = await Fabric.findByPk(fabric.id);
      return f.stockQuantity === 0 ? f : null;
    });
    expect(reloaded).not.toBeNull();
    expect(reloaded.stockQuantity).toBe(0);
    expect(reloaded.inStock).toBe(false);
  });

  test('an out-of-stock fabric cannot be added to cart and is hidden from the store listing', async () => {
    const { Fabric } = require('../src/models');
    const fabric = await Fabric.create({
      name: 'Sold Out Flannel',
      description: 'Gone.',
      material: 'Flannel',
      color: 'Grey',
      priceCents: 300000,
      inStock: false,
      stockQuantity: 0,
      sortOrder: 98,
    });

    const storeList = await request(app).get('/store');
    expect(storeList.text).not.toContain('Sold Out Flannel');

    const customer = request.agent(app);
    const productPage = await customer.get(`/store/fabrics/${fabric.id}`);
    expect(productPage.text).toContain('out of stock');
    const token = extractCsrfToken(productPage.text);

    const res = await customer
      .post(`/store/fabrics/${fabric.id}/add-to-cart`)
      .type('form')
      .send({ _csrf: token, 'measurements[height]': '180' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('out of stock');
  });

  test('admin can manually toggle a fabric out of stock and back', async () => {
    const { Fabric } = require('../src/models');
    const fabric = await Fabric.create({
      name: 'Manual Toggle Wool',
      description: 'Toggle me.',
      material: 'Wool',
      color: 'Charcoal',
      priceCents: 450000,
      inStock: true,
      stockQuantity: null,
      sortOrder: 97,
    });

    const admin = await loginAdmin();
    const fabricsPage = await admin.get('/admin/fabrics');
    const token = extractCsrfToken(fabricsPage.text);

    await admin.post(`/admin/fabrics/${fabric.id}/toggle-stock`).type('form').send({ _csrf: token });
    let reloaded = await Fabric.findByPk(fabric.id);
    expect(reloaded.inStock).toBe(false);

    const fabricsPage2 = await admin.get('/admin/fabrics');
    const token2 = extractCsrfToken(fabricsPage2.text);
    await admin.post(`/admin/fabrics/${fabric.id}/toggle-stock`).type('form').send({ _csrf: token2 });
    reloaded = await Fabric.findByPk(fabric.id);
    expect(reloaded.inStock).toBe(true);
  });
});
