module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fabrics', 'stock_quantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('fabrics', 'stock_quantity');
  },
};
