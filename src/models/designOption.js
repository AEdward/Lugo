module.exports = (sequelize, DataTypes) => {
  const DesignOption = sequelize.define('DesignOption', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category: {
      type: DataTypes.ENUM('lapel', 'buttons', 'lining', 'fit', 'monogram', 'pocket'),
      allowNull: false,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    priceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, {
    tableName: 'design_options',
  });

  return DesignOption;
};
