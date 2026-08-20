const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const NewsletterSubscriber = sequelize.define(
    'NewsletterSubscriber',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
      subscribed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      unsubscribeToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: () => crypto.randomBytes(20).toString('hex'),
      },
      source: { type: DataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'newsletter_subscribers',
    }
  );

  return NewsletterSubscriber;
};
