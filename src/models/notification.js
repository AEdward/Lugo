module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      audience: { type: DataTypes.ENUM('admin', 'customer'), allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: true },
      type: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: true },
      link: { type: DataTypes.STRING, allowNull: true },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'notifications',
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.Customer, { foreignKey: 'customerId' });
  };

  return Notification;
};
