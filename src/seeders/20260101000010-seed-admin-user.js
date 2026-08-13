const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const email = process.env.ADMIN_EMAIL || 'admin@lugotailoring.com';
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        name: 'Lugo Admin',
        email,
        password_hash: passwordHash,
        role: 'admin',
        created_at: now,
        updated_at: now,
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', {});
  },
};
