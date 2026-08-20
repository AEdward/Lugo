module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('page_views', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      path: { type: Sequelize.STRING, allowNull: false },
      referrer: { type: Sequelize.STRING, allowNull: true },
      // sha256(ip + user-agent + calendar day) — enough to approximate unique
      // visitors without ever storing a raw IP address.
      visitor_hash: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('page_views', ['path']);
    await queryInterface.addIndex('page_views', ['created_at']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('page_views');
  },
};
