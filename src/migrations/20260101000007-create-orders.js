module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      order_number: { type: Sequelize.STRING, allowNull: false, unique: true },
      customer_name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false },
      fabric_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'fabrics', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      selected_options: { type: Sequelize.JSON, allowNull: false },
      measurements: { type: Sequelize.JSON, allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      subtotal_cents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      total_cents: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'ETB' },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
      },
      status: {
        type: Sequelize.ENUM('pending_payment', 'paid', 'in_production', 'ready', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending_payment',
      },
      chapa_tx_ref: { type: Sequelize.STRING, allowNull: true },
      chapa_checkout_url: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('orders', ['chapa_tx_ref']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('orders');
  },
};
