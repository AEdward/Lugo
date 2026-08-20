module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pages', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      content: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('pages');
  },
};
