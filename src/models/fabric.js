module.exports = (sequelize, DataTypes) => {
  const Fabric = sequelize.define('Fabric', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    material: { type: DataTypes.STRING, allowNull: true },
    color: { type: DataTypes.STRING, allowNull: true },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    priceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    inStock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });

  Fabric.associate = (models) => {
    Fabric.hasMany(models.Order, { foreignKey: 'fabricId' });
  };

  return Fabric;
};
