module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: Sequelize.STRING, allowNull: false, unique: true },
      value: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('settings');
  },
};
