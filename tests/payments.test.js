const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

async function addToCart(agent, fabricId) {
  const productPage = await agent.get(`/store/fabrics/${fabricId}`);
  const token = extractCsrfToken(productPage.text);
  await agent
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

function extractTxRefFromLocation(location) {
  return decodeURIComponent(location.split('/order/confirmation/')[1]);
}

describe('alternative checkout payment methods', () => {
  let app;
  let adminPassword;
  let fabric;

  beforeAll(async () => {
    ({ app, adminPassword, fabric } = await buildTestApp());
  });

  test('bank transfer: checkout redirects to confirmation, receipt upload, and admin review', async () => {
    const customer = request.agent(app);
    await addToCart(customer, fabric.id);

    const checkoutPage = await customer.get('/checkout');
    expect(checkoutPage.text).toContain('bank_transfer');
    const token = extractCsrfToken(checkoutPage.text);

    const checkoutRes = await customer.post('/checkout').type('form').send({
      _csrf: token,
      customerName: 'Bank Customer',
      email: 'bank@example.com',
      phone: '+251911111111',
      paymentMethod: 'bank_transfer',
    });
    expect(checkoutRes.status).toBe(302);
    const txRef = extractTxRefFromLocation(checkoutRes.headers.location);

    const confirmPage = await customer.get(`/order/confirmation/${txRef}`);
    expect(confirmPage.status).toBe(200);
    expect(confirmPage.text).toContain('Upload Receipt');
    const receiptToken = extractCsrfToken(confirmPage.text);

    const uploadRes = await customer
      .post(`/order/confirmation/${txRef}/receipt`)
      .field('_csrf', receiptToken)
      .attach('receipt', Buffer.from('fake receipt bytes'), { filename: 'receipt.png', contentType: 'image/png' });
    expect(uploadRes.status).toBe(302);

    const afterUpload = await customer.get(`/order/confirmation/${txRef}`);
    expect(afterUpload.text).toContain("we'll confirm your payment shortly");

    // Admin reviews and marks it paid.
    const admin = request.agent(app);
    const loginPage = await admin.get('/admin/login');
    const adminToken = extractCsrfToken(loginPage.text);
    await admin.post('/admin/login').type('form').send({ _csrf: adminToken, email: 'admin@test.local', password: adminPassword });

    const ordersList = await admin.get('/admin/orders');
    expect(ordersList.text).toContain('bank transfer');
    const orderId = ordersList.text.match(/\/admin\/orders\/(\d+)/)[1];

    const orderDetail = await admin.get(`/admin/orders/${orderId}`);
    expect(orderDetail.text).toContain('Mark Paid');
    expect(orderDetail.text).toContain('pending review');
    const reviewToken = extractCsrfToken(orderDetail.text);

    const markPaidRes = await admin.post(`/admin/orders/${orderId}/receipt-status`).type('form').send({ _csrf: reviewToken, receiptStatus: 'paid' });
    expect(markPaidRes.status).toBe(302);

    const finalDetail = await admin.get(`/admin/orders/${orderId}`);
    expect(finalDetail.text).toMatch(/badge badge-paid">paid/);
  });

  test('cash: checkout redirects to confirmation, admin marks cash received', async () => {
    const customer = request.agent(app);
    await addToCart(customer, fabric.id);

    const checkoutPage = await customer.get('/checkout');
    const token = extractCsrfToken(checkoutPage.text);
    const checkoutRes = await customer.post('/checkout').type('form').send({
      _csrf: token,
      customerName: 'Cash Customer',
      email: 'cash@example.com',
      phone: '+251922222222',
      paymentMethod: 'cash',
    });
    expect(checkoutRes.status).toBe(302);
    const txRef = extractTxRefFromLocation(checkoutRes.headers.location);

    const confirmPage = await request(app).get(`/order/confirmation/${txRef}`);
    expect(confirmPage.text).toContain('Your order is reserved');

    const admin = request.agent(app);
    const loginPage = await admin.get('/admin/login');
    const adminToken = extractCsrfToken(loginPage.text);
    await admin.post('/admin/login').type('form').send({ _csrf: adminToken, email: 'admin@test.local', password: adminPassword });

    const ordersList = await admin.get('/admin/orders');
    const rows = ordersList.text.split('Cash Customer');
    const orderId = rows[1].match(/\/admin\/orders\/(\d+)/)[1];

    const orderDetail = await admin.get(`/admin/orders/${orderId}`);
    expect(orderDetail.text).toContain('Mark Cash Received');
    const cashToken = extractCsrfToken(orderDetail.text);

    const markPaidRes = await admin.post(`/admin/orders/${orderId}/mark-cash-paid`).type('form').send({ _csrf: cashToken });
    expect(markPaidRes.status).toBe(302);

    const finalDetail = await admin.get(`/admin/orders/${orderId}`);
    expect(finalDetail.text).toMatch(/badge badge-paid">paid/);
  });
});
