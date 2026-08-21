'use strict';

// The public nav now calls this page "Collections" instead of "Gallery" (the
// /gallery URL is unchanged). Updates the page's own heading/SEO title to
// match — but only if they still hold the original seeded defaults, so an
// admin's own customization of this copy is never overwritten.
module.exports = {
  up: async (queryInterface) => {
    const [rows] = await queryInterface.sequelize.query("SELECT id, content FROM pages WHERE slug = 'gallery'");
    if (!rows.length) return;

    const row = rows[0];
    let content = row.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = {};
      }
    }
    content = content && typeof content === 'object' ? content : {};

    const updated = { ...content };
    if (updated.heading === 'Gallery') updated.heading = 'Collections';
    if (updated.seoTitle === 'Gallery — Lugo Tailoring') updated.seoTitle = 'Collections — Lugo Tailoring';

    await queryInterface.sequelize.query('UPDATE pages SET content = ? WHERE id = ?', {
      replacements: [JSON.stringify(updated), row.id],
    });
  },

  down: async (queryInterface) => {
    const [rows] = await queryInterface.sequelize.query("SELECT id, content FROM pages WHERE slug = 'gallery'");
    if (!rows.length) return;

    const row = rows[0];
    let content = row.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = {};
      }
    }
    content = content && typeof content === 'object' ? content : {};

    const reverted = { ...content };
    if (reverted.heading === 'Collections') reverted.heading = 'Gallery';
    if (reverted.seoTitle === 'Collections — Lugo Tailoring') reverted.seoTitle = 'Gallery — Lugo Tailoring';

    await queryInterface.sequelize.query('UPDATE pages SET content = ? WHERE id = ?', {
      replacements: [JSON.stringify(reverted), row.id],
    });
  },
};
