module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('fabrics', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      material: { type: Sequelize.STRING, allowNull: true },
      color: { type: Sequelize.STRING, allowNull: true },
      image_url: { type: Sequelize.STRING, allowNull: true },
      price_cents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      in_stock: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('fabrics');
  },
};
