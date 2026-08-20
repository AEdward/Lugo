module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'payment_method', {
      type: Sequelize.ENUM('chapa', 'cash', 'bank_transfer'),
      allowNull: false,
      defaultValue: 'chapa',
    });
    await queryInterface.addColumn('orders', 'receipt_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    // Only meaningful for payment_method = 'bank_transfer'; stays
    // 'not_applicable' for chapa/cash orders.
    await queryInterface.addColumn('orders', 'receipt_status', {
      type: Sequelize.ENUM('not_applicable', 'awaiting_upload', 'pending_review', 'paid', 'unpaid', 'invalid_receipt'),
      allowNull: false,
      defaultValue: 'not_applicable',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'payment_method');
    await queryInterface.removeColumn('orders', 'receipt_url');
    await queryInterface.removeColumn('orders', 'receipt_status');
  },
};
