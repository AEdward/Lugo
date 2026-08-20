const bcrypt = require('bcryptjs');

// Requiring these lazily (inside buildTestApp) matters: Jest sets
// NODE_ENV=test before this file's module code runs, but src/config/database.js
// reads process.env.NODE_ENV at require time to pick sqlite — requiring
// src/models any earlier (e.g. at this file's top level) risks a stale env.
async function buildTestApp() {
  const { sequelize, User, Fabric, DesignOption } = require('../../src/models');
  const createApp = require('../../src/app');

  await sequelize.sync({ force: true });

  const adminPassword = 'AdminPass123!';
  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin@test.local',
    passwordHash: await bcrypt.hash(adminPassword, 10),
    role: 'admin',
  });

  const fabric = await Fabric.create({
    name: 'Test Wool',
    description: 'A test fabric.',
    material: 'Wool',
    color: 'Navy',
    priceCents: 400000,
    inStock: true,
    sortOrder: 1,
  });

  const designOption = await DesignOption.create({
    category: 'lapel',
    name: 'Notch Lapel',
    description: 'A test design option.',
    priceCents: 0,
    sortOrder: 1,
  });

  const app = createApp();

  return { app, sequelize, admin, adminPassword, fabric, designOption };
}

module.exports = { buildTestApp };
