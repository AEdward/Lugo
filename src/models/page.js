module.exports = (sequelize, DataTypes) => {
  const Page = sequelize.define(
    'Page',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      // Editable copy for this page: { seoTitle, seoDescription, eyebrow, heading,
      // intro, heroVideoUrl }. Not every page uses every field (e.g. heroVideoUrl
      // is only rendered on 'home') — templates fall back to hardcoded defaults
      // for anything blank, so partially-filled content never breaks a page.
      //
      // MariaDB (e.g. XAMPP's bundled MySQL) implements JSON columns as plain
      // LONGTEXT, so the driver-level auto-parsing that real MySQL's native JSON
      // type gets doesn't happen there — this getter normalizes either case.
      content: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
        get() {
          const raw = this.getDataValue('content');
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
    },
    {
      tableName: 'pages',
    }
  );

  return Page;
};
