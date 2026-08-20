'use strict';

// Backfills content.blocks for existing installs, where the home/about/bespoke
// Page rows already exist from before blocks existed (Phase K). Fresh
// installs get blocks straight from the initial insert instead — see
// src/seeders/20260101000014-seed-pages.js — since seeders run after
// migrations and this migration would otherwise find no rows yet to update.
const BLOCKS_BY_SLUG = require('../data/pageBlocksSeed');

module.exports = {
  up: async (queryInterface) => {
    const slugs = Object.keys(BLOCKS_BY_SLUG);
    for (const slug of slugs) {
      // eslint-disable-next-line no-await-in-loop
      const [rows] = await queryInterface.sequelize.query('SELECT id, content FROM pages WHERE slug = ?', {
        replacements: [slug],
      });
      if (!rows.length) continue;

      const row = rows[0];
      let existing = row.content;
      if (typeof existing === 'string') {
        try {
          existing = JSON.parse(existing);
        } catch {
          existing = {};
        }
      }
      existing = existing && typeof existing === 'object' ? existing : {};
      if (existing.blocks && existing.blocks.length) continue; // already has blocks (e.g. seeded fresh)

      const updated = { ...existing, blocks: BLOCKS_BY_SLUG[slug] };
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query('UPDATE pages SET content = ? WHERE id = ?', {
        replacements: [JSON.stringify(updated), row.id],
      });
    }
  },

  down: async (queryInterface) => {
    const slugs = Object.keys(BLOCKS_BY_SLUG);
    for (const slug of slugs) {
      // eslint-disable-next-line no-await-in-loop
      const [rows] = await queryInterface.sequelize.query('SELECT id, content FROM pages WHERE slug = ?', {
        replacements: [slug],
      });
      if (!rows.length) continue;

      const row = rows[0];
      let existing = row.content;
      if (typeof existing === 'string') {
        try {
          existing = JSON.parse(existing);
        } catch {
          existing = {};
        }
      }
      existing = existing && typeof existing === 'object' ? existing : {};
      delete existing.blocks;

      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query('UPDATE pages SET content = ? WHERE id = ?', {
        replacements: [JSON.stringify(existing), row.id],
      });
    }
  },
};
