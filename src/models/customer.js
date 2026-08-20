module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
  }, {
    tableName: 'customers',
  });

  Customer.associate = (models) => {
    Customer.hasMany(models.Booking, { foreignKey: 'customerId' });
    Customer.hasMany(models.Order, { foreignKey: 'customerId' });
  };

  return Customer;
};
