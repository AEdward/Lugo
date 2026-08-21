'use strict';

// Replaces the homepage's content.blocks with the new design (heading +
// feature row, bespoke/made-to-measure banners, art-of-the-suit collage,
// collections grid, process timeline, detail swatches, testimonials, and a
// background-image final CTA). Unlike the Phase Y backfill migration, this
// unconditionally overwrites — it's a deliberate homepage redesign, not a
// one-time backfill for pre-existing rows.
const NEW_HOME_BLOCKS = require('../data/pageBlocksSeed').home;

const OLD_HOME_BLOCKS = [
  {
    id: 'home-two-ways',
    type: 'feature-grid',
    data: {
      eyebrow: 'Two Ways to Work With Us',
      heading: 'Choose Your Path',
      columns: 2,
      cardStyle: true,
      items: [
        {
          eyebrow: 'In-Studio & By Appointment',
          title: 'Bespoke',
          text: 'A suit built entirely from scratch by a single tailor, refined across multiple in-person fittings. The full Lugo Tailoring experience.',
          buttonLabel: 'Explore Bespoke',
          buttonHref: '/bespoke',
        },
        {
          eyebrow: 'Configure Online',
          title: 'Made-to-Measure',
          text: 'Pick your fabric and details visually, submit your own measurements, and pay online — no studio visit required to get started.',
          buttonLabel: 'Design Online',
          buttonHref: '/store',
        },
      ],
    },
  },
  {
    id: 'home-three-steps',
    type: 'feature-grid',
    data: {
      eyebrow: 'How Made-to-Measure Works',
      heading: 'Three Simple Steps',
      columns: 3,
      sectionStyle: 'alt',
      items: [
        { icon: '01', title: 'Choose Your Fabric', text: 'Browse a curated selection of wools, flannels, and blends sourced from renowned mills.' },
        { icon: '02', title: 'Configure the Details', text: 'Select your lapel, fit, lining, and finishing touches — then submit your exact measurements.' },
        { icon: '03', title: 'Book Your Fitting', text: 'Reserve a time with our tailors for a consultation, fitting, or final delivery.' },
      ],
    },
  },
  {
    id: 'home-craftsmanship',
    type: 'image-text',
    data: {
      src: '/images/about-atelier.png',
      alt: 'Lugo Tailoring workshop',
      imagePosition: 'right',
      eyebrow: 'Craftsmanship',
      heading: 'Every stitch happens in our workshop.',
      paragraphs: [
        {
          text: 'From fabric sourcing to the final press, every Lugo garment is cut, sewn, and finished in-house — never outsourced. Buttonholes and linings are hand-finished by the same tailors who cut your pattern.',
          soft: true,
        },
      ],
      buttonLabel: 'See the Bespoke Process',
      buttonHref: '/bespoke',
    },
  },
  {
    id: 'home-final-cta',
    type: 'cta',
    data: {
      eyebrow: 'Ready When You Are',
      heading: 'Start your custom suit today',
      text: "Whether you know exactly what you want or need guidance from our tailors, we'll help you build something that fits perfectly.",
      maxWidth: 520,
      textMargin: 28,
      buttons: [
        { label: 'Browse Fabrics', href: '/store', style: 'primary' },
        { label: 'Talk to Us', href: '/contact', style: 'outline' },
      ],
    },
  },
];

async function replaceHomeBlocks(queryInterface, blocks) {
  const [rows] = await queryInterface.sequelize.query("SELECT id, content FROM pages WHERE slug = 'home'");
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

  const updated = { ...content, blocks };
  await queryInterface.sequelize.query('UPDATE pages SET content = ? WHERE id = ?', {
    replacements: [JSON.stringify(updated), row.id],
  });
}

module.exports = {
  up: async (queryInterface) => replaceHomeBlocks(queryInterface, NEW_HOME_BLOCKS),
  down: async (queryInterface) => replaceHomeBlocks(queryInterface, OLD_HOME_BLOCKS),
};
