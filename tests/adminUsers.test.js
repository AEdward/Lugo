const request = require('supertest');
const { buildTestApp } = require('./helpers/app');
const { extractCsrfToken } = require('./helpers/csrf');

describe('admin user management', () => {
  let app;
  let adminPassword;
  let agent;

  beforeAll(async () => {
    ({ app, adminPassword } = await buildTestApp());
  });

  beforeEach(async () => {
    agent = request.agent(app);
    const loginPage = await agent.get('/admin/login');
    const token = extractCsrfToken(loginPage.text);
    await agent.post('/admin/login').type('form').send({ _csrf: token, email: 'admin@test.local', password: adminPassword });
  });

  test('add, edit, and delete a staff user', async () => {
    const listPage = await agent.get('/admin/users');
    const addToken = extractCsrfToken(listPage.text);

    const addRes = await agent.post('/admin/users').type('form').send({
      _csrf: addToken,
      name: 'Staff Person',
      email: 'staff@test.local',
      role: 'staff',
      password: 'StaffPass123',
    });
    expect(addRes.status).toBe(302);

    let list = await agent.get('/admin/users');
    expect(list.text).toContain('Staff Person');

    const staffId = list.text.match(/\/admin\/users\/(\d+)\/edit/g).map((m) => Number(m.match(/\d+/)[0])).sort((a, b) => b - a)[0];

    const editPage = await agent.get(`/admin/users/${staffId}/edit`);
    expect(editPage.status).toBe(200);
    expect(editPage.text).toContain('staff@test.local');
    const editToken = extractCsrfToken(editPage.text);

    const editRes = await agent.post(`/admin/users/${staffId}/edit`).type('form').send({
      _csrf: editToken,
      name: 'Staff Person Renamed',
      email: 'staff@test.local',
      role: 'staff',
      password: '',
    });
    expect(editRes.status).toBe(302);

    list = await agent.get('/admin/users');
    expect(list.text).toContain('Staff Person Renamed');

    const deleteToken = extractCsrfToken(list.text);
    const deleteRes = await agent.post(`/admin/users/${staffId}/delete`).type('form').send({ _csrf: deleteToken });
    expect(deleteRes.status).toBe(302);

    list = await agent.get('/admin/users');
    expect(list.text).not.toContain('Staff Person Renamed');
  });

  test('rejects a duplicate email on add', async () => {
    const listPage = await agent.get('/admin/users');
    const token = extractCsrfToken(listPage.text);

    const res = await agent.post('/admin/users').type('form').send({
      _csrf: token,
      name: 'Duplicate Admin',
      email: 'admin@test.local',
      role: 'staff',
      password: 'SomePass123',
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain('already exists');
  });

  test('an admin cannot delete their own account', async () => {
    const listPage = await agent.get('/admin/users');
    const token = extractCsrfToken(listPage.text);

    const res = await agent.post('/admin/users/1/delete').type('form').send({ _csrf: token });
    expect(res.status).toBe(302);

    const dashboard = await agent.get('/admin');
    expect(dashboard.status).toBe(200); // session still valid — account wasn't deleted
  });

  test('an admin cannot remove their own admin role', async () => {
    const editPage = await agent.get('/admin/users/1/edit');
    const token = extractCsrfToken(editPage.text);

    const res = await agent.post('/admin/users/1/edit').type('form').send({
      _csrf: token,
      name: 'Test Admin',
      email: 'admin@test.local',
      role: 'staff',
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain('cannot remove your own admin role');
  });

  test('editing a user without a CSRF token is rejected', async () => {
    const res = await agent.post('/admin/users/1/edit').type('form').send({
      name: 'Forged Rename',
      email: 'admin@test.local',
      role: 'admin',
    });
    expect(res.status).toBe(403);
  });
});
