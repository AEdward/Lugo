module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    // Nullable — checkout doesn't require an account (guest checkout stays
    // fully supported); set when a logged-in customer places the order.
    customerId: { type: DataTypes.INTEGER, allowNull: true },
    customerName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING, allowNull: false },
    fabricId: { type: DataTypes.INTEGER, allowNull: false },
    // Snapshot of chosen design options: [{ id, category, name, priceCents, imageUrl }]
    //
    // MariaDB (e.g. XAMPP's bundled MySQL) implements JSON columns as plain
    // LONGTEXT, so the driver-level auto-parsing that real MySQL's native
    // JSON type gets doesn't happen there — the raw JSON string comes back
    // instead of a parsed array. These getters normalize either case so
    // callers always get real arrays/objects regardless of database engine.
    selectedOptions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        const raw = this.getDataValue('selectedOptions');
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }
        return [];
      },
    },
    // { chest, waist, hips, shoulder, sleeveLength, neck, inseam, height, weight, notes } — cm
    measurements: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      get() {
        const raw = this.getDataValue('measurements');
        if (raw && typeof raw === 'object') return raw;
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
          } catch {
            return {};
          }
        }
        return {};
      },
    },
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
    Order.belongsTo(models.Customer, { foreignKey: 'customerId' });
  };

  return Order;
};
