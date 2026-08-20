module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const pages = [
      {
        slug: 'home',
        content: {
          seoTitle: 'Lugo Tailoring — Bespoke Luxury Suits',
          seoDescription:
            'Lugo Tailoring crafts custom luxury suits, cut and finished by hand. Book a fitting or design your suit online.',
          eyebrow: 'Bespoke · Handcrafted · Made to Measure',
          heading: 'Luxury tailoring, cut precisely to you.',
          intro:
            'Lugo Tailoring crafts custom suits from the finest fabrics — fitted in-studio or configured entirely online, with every measurement and detail chosen by you.',
          heroVideoUrl: '',
        },
      },
      {
        slug: 'about',
        content: {
          seoTitle: 'About — Lugo Tailoring',
          seoDescription: 'The story and standards behind Lugo Tailoring, a custom luxury suit tailoring studio.',
          eyebrow: 'Our Story',
          heading: 'Tailoring, the way it used to be.',
          intro:
            'Lugo Tailoring was founded on a simple idea: a suit should be built entirely around the person wearing it — not the other way around.',
        },
      },
      {
        slug: 'bespoke',
        content: {
          seoTitle: 'Bespoke Tailoring — Lugo Tailoring',
          seoDescription: 'A suit built entirely from scratch, around you — cut by hand and fitted in person at the Lugo Tailoring studio.',
          eyebrow: 'By Appointment Only',
          heading: 'Bespoke Tailoring',
          intro:
            'A suit built entirely from scratch, around you — cut by hand, fitted in person, and finished in our studio. This is the full Lugo Tailoring experience, from first consultation to final stitch.',
        },
      },
      {
        slug: 'gallery',
        content: {
          seoTitle: 'Gallery — Lugo Tailoring',
          seoDescription: 'A selection of recent commissions from the Lugo Tailoring studio.',
          eyebrow: 'Portfolio',
          heading: 'Gallery',
          intro: 'A selection of recent commissions from the Lugo Tailoring studio.',
        },
      },
      {
        slug: 'contact',
        content: {
          seoTitle: 'Contact — Lugo Tailoring',
          seoDescription: 'Get in touch with Lugo Tailoring about a custom order or appointment.',
          eyebrow: 'Get in Touch',
          heading: 'Contact Us',
          intro: "Questions about a custom order or your appointment? Send us a message and we'll respond within one business day.",
        },
      },
    ].map((p) => ({
      slug: p.slug,
      content: JSON.stringify(p.content),
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkInsert('pages', pages);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('pages', {});
  },
};
