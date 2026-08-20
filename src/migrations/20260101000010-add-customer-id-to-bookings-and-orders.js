module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bookings', 'customer_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'customers', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('orders', 'customer_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'customers', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('bookings', ['customer_id']);
    await queryInterface.addIndex('orders', ['customer_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('bookings', 'customer_id');
    await queryInterface.removeColumn('orders', 'customer_id');
  },
};
