module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      customer_name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false },
      service_type: {
        type: Sequelize.ENUM('consultation', 'measurement', 'fitting', 'alteration', 'delivery'),
        allowNull: false,
        defaultValue: 'consultation',
      },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'rejected', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      hold_expires_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('bookings', ['starts_at']);
    await queryInterface.addIndex('bookings', ['status']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('bookings');
  },
};
