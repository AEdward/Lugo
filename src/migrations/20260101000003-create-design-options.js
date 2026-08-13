module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('design_options', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      category: {
        type: Sequelize.ENUM('lapel', 'buttons', 'lining', 'fit', 'monogram', 'pocket'),
        allowNull: false,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      price_cents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      image_url: { type: Sequelize.STRING, allowNull: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('design_options');
  },
};
