const request = require('supertest');
const bcrypt = require('bcryptjs');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('membership tiers', () => {
  let app;
  let adminPassword;
  let fabric;

  beforeAll(async () => {
    ({ app, adminPassword, fabric } = await buildTestApp());
  });

  async function loginAdmin() {
    const admin = request.agent(app);
    const loginPage = await admin.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await admin.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
    return admin;
  }

  async function createCustomerWithPaidOrders(email, paidCount) {
    const { Customer, Order } = require('../src/models');
    const customer = await Customer.create({
      name: 'Member ' + email,
      email,
      passwordHash: await bcrypt.hash('testpass123', 10),
    });
    for (let i = 0; i < paidCount; i++) {
      // eslint-disable-next-line no-await-in-loop
      await Order.create({
        orderNumber: `MEMTEST-${email}-${i}`,
        customerId: customer.id,
        fabricId: fabric.id,
        customerName: customer.name,
        email: customer.email,
        phone: '0000000000',
        measurements: {},
        totalCents: 100000,
        paymentStatus: 'paid',
        status: 'confirmed',
        paymentMethod: 'chapa',
      });
    }
    return customer;
  }

  test('admin can change tier thresholds from Settings and they persist', async () => {
    const admin = await loginAdmin();
    const settingsPage = await admin.get('/admin/settings');
    expect(settingsPage.text).toContain('tier1Min');
    const token = extractCsrfToken(settingsPage.text);

    const res = await admin.post('/admin/settings').type('form').send({
      _csrf: token,
      siteName: 'Lugo Tailoring',
      tier1Min: '2',
      tier2Min: '4',
      tier3Min: '8',
    });
    expect(res.status).toBe(302);

    const settingsService = require('../src/services/settingsService');
    const settings = await settingsService.getSiteSettings();
    expect(settings.tier1Min).toBe('2');
    expect(settings.tier2Min).toBe('4');
    expect(settings.tier3Min).toBe('8');
  });

  test('a customer with no paid orders is a New Customer', async () => {
    const customer = await createCustomerWithPaidOrders('notier@example.com', 0);
    const membershipService = require('../src/services/membershipService');
    const membership = await membershipService.getTierForCustomer(customer.id);
    expect(membership.tier).toBe(0);
    expect(membership.label).toBe('New Customer');
  });

  test('crossing the tier2 threshold classifies the customer as Tier 2 on the dashboard and in admin', async () => {
    // Using the thresholds saved above: tier1Min=2, tier2Min=4, tier3Min=8.
    const customer = await createCustomerWithPaidOrders('tier2member@example.com', 5);

    const agent = request.agent(app);
    const loginPage = await agent.get('/account/login');
    const token = extractCsrfToken(loginPage.text);
    await agent.post('/account/login').type('form').send({ _csrf: token, email: 'tier2member@example.com', password: 'testpass123' });

    const dashboard = await agent.get('/account');
    expect(dashboard.text).toContain('Tier 2');
    expect(dashboard.text).toContain('5 paid order');

    const admin = await loginAdmin();
    const clientsList = await admin.get('/admin/clients');
    expect(clientsList.text).toContain('Tier 2');

    const clientDetail = await admin.get(`/admin/clients/${customer.id}`);
    expect(clientDetail.text).toContain('Tier 2');
  });
});
