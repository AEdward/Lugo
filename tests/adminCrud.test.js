const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('admin fabric & design option management', () => {
  let app;
  let adminPassword;
  let fabric;
  let designOption;
  let agent;

  beforeAll(async () => {
    ({ app, adminPassword, fabric, designOption } = await buildTestApp());
  });

  beforeEach(async () => {
    agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await agent.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
  });

  test('add, edit, and delete a fabric', async () => {
    const listPage = await agent.get('/admin/fabrics');
    const addToken = extractCsrfToken(listPage.text);

    const addRes = await agent
      .post('/admin/fabrics')
      .field('_csrf', addToken)
      .field('name', 'Midnight Tweed')
      .field('material', 'Wool Tweed')
      .field('color', 'Midnight Blue')
      .field('price', '39.99');
    expect(addRes.status).toBe(302);

    let list = await agent.get('/admin/fabrics');
    expect(list.text).toContain('Midnight Tweed');

    // The newly added fabric has the highest id (only the seeded fabric predates it).
    const fabricIds = [...list.text.matchAll(/\/admin\/fabrics\/(\d+)\/edit/g)].map((m) => Number(m[1]));
    const newFabricId = Math.max(...fabricIds);

    const editPage = await agent.get(`/admin/fabrics/${newFabricId}/edit`);
    expect(editPage.status).toBe(200);
    expect(editPage.text).toContain('Midnight Tweed');
    const editToken = extractCsrfToken(editPage.text);

    const editRes = await agent
      .post(`/admin/fabrics/${newFabricId}/edit`)
      .field('_csrf', editToken)
      .field('name', 'Midnight Tweed (Updated)')
      .field('material', 'Wool Tweed')
      .field('color', 'Midnight Blue')
      .field('price', '44.99');
    expect(editRes.status).toBe(302);

    list = await agent.get('/admin/fabrics');
    expect(list.text).toContain('Midnight Tweed (Updated)');

    const deleteToken = extractCsrfToken(list.text);
    const deleteRes = await agent
      .post(`/admin/fabrics/${newFabricId}/delete`)
      .type('form')
      .send({ _csrf: deleteToken });
    expect(deleteRes.status).toBe(302);

    list = await agent.get('/admin/fabrics');
    expect(list.text).not.toContain('Midnight Tweed (Updated)');
  });

  test('editing a fabric without a CSRF token is rejected and leaves it unchanged', async () => {
    const res = await agent
      .post(`/admin/fabrics/${fabric.id}/edit`)
      .field('name', 'Forged Rename')
      .field('material', 'Wool')
      .field('price', '1');
    expect(res.status).toBe(403);

    const list = await agent.get('/admin/fabrics');
    expect(list.text).not.toContain('Forged Rename');
    expect(list.text).toContain(fabric.name);
  });

  test('add, edit, and delete a design option', async () => {
    const listPage = await agent.get('/admin/design-options');
    const addToken = extractCsrfToken(listPage.text);

    const addRes = await agent
      .post('/admin/design-options')
      .field('_csrf', addToken)
      .field('category', 'buttons')
      .field('name', 'Horn Buttons')
      .field('price', '10')
      .field('description', 'Genuine horn buttons.');
    expect(addRes.status).toBe(302);

    let list = await agent.get('/admin/design-options');
    expect(list.text).toContain('Horn Buttons');

    // The newly added option has the highest id (only the seeded option predates it).
    const optionIds = [...list.text.matchAll(/\/admin\/design-options\/(\d+)\/edit/g)].map((m) => Number(m[1]));
    const newId = Math.max(...optionIds);

    const editPage = await agent.get(`/admin/design-options/${newId}/edit`);
    const editToken = extractCsrfToken(editPage.text);
    const editRes = await agent
      .post(`/admin/design-options/${newId}/edit`)
      .field('_csrf', editToken)
      .field('category', 'buttons')
      .field('name', 'Horn Buttons (Renamed)')
      .field('price', '12')
      .field('description', 'Genuine horn buttons.');
    expect(editRes.status).toBe(302);

    list = await agent.get('/admin/design-options');
    expect(list.text).toContain('Horn Buttons (Renamed)');

    const deleteToken = extractCsrfToken(list.text);
    const deleteRes = await agent
      .post(`/admin/design-options/${newId}/delete`)
      .type('form')
      .send({ _csrf: deleteToken });
    expect(deleteRes.status).toBe(302);

    list = await agent.get('/admin/design-options');
    expect(list.text).not.toContain('Horn Buttons (Renamed)');
    expect(list.text).toContain(designOption.name);
  });
});
