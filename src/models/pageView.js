module.exports = (sequelize, DataTypes) => {
  const PageView = sequelize.define(
    'PageView',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      path: { type: DataTypes.STRING, allowNull: false },
      referrer: { type: DataTypes.STRING, allowNull: true },
      visitorHash: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'page_views',
      updatedAt: false,
    }
  );

  return PageView;
};
