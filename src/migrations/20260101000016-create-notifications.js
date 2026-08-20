module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      audience: { type: Sequelize.ENUM('admin', 'customer'), allowNull: false },
      // Set only for audience='customer'; null for audience='admin' (broadcast
      // to every admin user — there's no per-admin-user targeting).
      customer_id: { type: Sequelize.INTEGER, allowNull: true },
      type: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: true },
      link: { type: Sequelize.STRING, allowNull: true },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('notifications', ['audience', 'customer_id', 'read_at']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
  },
};
