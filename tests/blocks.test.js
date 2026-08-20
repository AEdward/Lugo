const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('block-based page CMS', () => {
  let app;
  let adminPassword;
  let admin;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
  });

  beforeEach(async () => {
    admin = request.agent(app);
    const loginPage = await admin.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await admin.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
  });

  test('adding a heading block appears on the public About page', async () => {
    const addForm = await admin.get('/admin/pages/about/blocks/new?type=heading');
    expect(addForm.status).toBe(200);
    const token = extractCsrfToken(addForm.text);

    const res = await admin.post('/admin/pages/about/blocks/new').type('form').send({
      _csrf: token,
      type: 'heading',
      eyebrow: 'Test Eyebrow',
      heading: 'Test Added Heading',
      align: 'center',
    });
    expect(res.status).toBe(302);

    const about = await request(app).get('/about');
    expect(about.text).toContain('Test Added Heading');
    expect(about.text).toContain('Test Eyebrow');
  });

  test('editing a block updates its rendered output', async () => {
    const editPage = await admin.get('/admin/pages/about/edit');
    const editLink = editPage.text.match(/\/admin\/pages\/about\/blocks\/([^/]+)\/edit/);
    expect(editLink).not.toBeNull();
    const blockId = editLink[1];

    const blockEditPage = await admin.get(`/admin/pages/about/blocks/${blockId}/edit`);
    expect(blockEditPage.status).toBe(200);
    const token = extractCsrfToken(blockEditPage.text);

    await admin.post(`/admin/pages/about/blocks/${blockId}/edit`).type('form').send({
      _csrf: token,
      type: 'heading',
      eyebrow: 'Edited Eyebrow',
      heading: 'Edited Heading Text',
      align: 'left',
    });

    const about = await request(app).get('/about');
    expect(about.text).toContain('Edited Heading Text');
  });

  test('move and delete reorder and remove blocks', async () => {
    // Add a second block so there's something to reorder against.
    const addForm = await admin.get('/admin/pages/about/blocks/new?type=text');
    const addToken = extractCsrfToken(addForm.text);
    await admin.post('/admin/pages/about/blocks/new').type('form').send({ _csrf: addToken, type: 'text', body: 'Movable paragraph.' });

    const editPage = await admin.get('/admin/pages/about/edit');
    const ids = [...editPage.text.matchAll(/\/admin\/pages\/about\/blocks\/([^/]+)\/edit/g)].map((m) => m[1]);
    const lastId = ids[ids.length - 1];

    const moveToken = extractCsrfToken(editPage.text);
    const moveRes = await admin.post(`/admin/pages/about/blocks/${lastId}/move`).type('form').send({ _csrf: moveToken, direction: 'up' });
    expect(moveRes.status).toBe(302);

    const afterMove = await admin.get('/admin/pages/about/edit');
    const idsAfterMove = [...afterMove.text.matchAll(/\/admin\/pages\/about\/blocks\/([^/]+)\/edit/g)].map((m) => m[1]);
    expect(idsAfterMove.indexOf(lastId)).toBeLessThan(ids.indexOf(lastId));

    const deleteToken = extractCsrfToken(afterMove.text);
    const deleteRes = await admin.post(`/admin/pages/about/blocks/${lastId}/delete`).type('form').send({ _csrf: deleteToken });
    expect(deleteRes.status).toBe(302);

    const about = await request(app).get('/about');
    expect(about.text).not.toContain('Movable paragraph.');
  });

  test('the block manager is not exposed for pages that do not render blocks', async () => {
    const res = await admin.get('/admin/pages/gallery/blocks/new?type=heading');
    expect(res.status).toBe(404);
  });
});
