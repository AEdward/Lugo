module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // Nullable — bookings don't require an account (guest checkout stays
    // fully supported); set when a logged-in customer submits the form.
    customerId: { type: DataTypes.INTEGER, allowNull: true },
    customerName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING, allowNull: false },
    serviceType: {
      type: DataTypes.ENUM('consultation', 'measurement', 'fitting', 'alteration', 'delivery'),
      allowNull: false,
      defaultValue: 'consultation',
    },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    holdExpiresAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    indexes: [
      { fields: ['starts_at'] },
      { fields: ['status'] },
    ],
  });

  Booking.associate = (models) => {
    Booking.belongsTo(models.Customer, { foreignKey: 'customerId' });
  };

  return Booking;
};
