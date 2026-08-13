module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    customerName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING, allowNull: false },
    fabricId: { type: DataTypes.INTEGER, allowNull: false },
    // Snapshot of chosen design options: [{ id, category, name, priceCents }]
    selectedOptions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    // { chest, waist, hips, shoulder, sleeveLength, neck, inseam, height, weight, notes } — cm
    measurements: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    notes: { type: DataTypes.TEXT, allowNull: true },
    subtotalCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'ETB' },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    status: {
      type: DataTypes.ENUM('pending_payment', 'paid', 'in_production', 'ready', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending_payment',
    },
    chapaTxRef: { type: DataTypes.STRING, allowNull: true },
    chapaCheckoutUrl: { type: DataTypes.STRING, allowNull: true },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.Fabric, { foreignKey: 'fabricId' });
  };

  return Order;
};
