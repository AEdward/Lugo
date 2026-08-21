const LAST_UPDATED = 'August 20, 2026';

const FAQ_BODY = `
<h2>How does made-to-measure ordering work?</h2>
<p>Browse our fabrics in the store, choose your lapel, fit, lining, and other details, then submit your own measurements at checkout. Your garment is cut and produced specifically for you.</p>

<h2>How is bespoke different from made-to-measure?</h2>
<p>Bespoke is built entirely from scratch by a single tailor across multiple in-person fittings — the full Lugo Tailoring experience. Made-to-measure is configured online and doesn't require a studio visit to get started. See our <a href="/bespoke">Bespoke</a> page for details.</p>

<h2>How long does an order take?</h2>
<p>Turnaround depends on the garment and current workload — we'll confirm an estimated timeline once your order or fitting is booked.</p>

<h2>What payment methods do you accept?</h2>
<p>We accept secure online payment through Chapa, bank transfer (with receipt upload), and cash in person.</p>

<h2>Can I change my measurements after ordering?</h2>
<p>Contact us as soon as possible — see our <a href="/refund-policy">Refund &amp; Return Policy</a> for how this affects your order.</p>

<h2>Still have a question?</h2>
<p><a href="/contact">Contact us</a> and we'll get back to you within one business day.</p>
`.trim();

const SHIPPING_BODY = `
<h2>Studio Pickup &amp; Fittings</h2>
<p>Most Lugo garments are collected in person at the studio, as part of your final fitting appointment — see <a href="/booking">Book an Appointment</a> to schedule one.</p>

<h2>Delivery</h2>
<p>If you're not able to visit the studio, let us know at checkout or by <a href="/contact">contacting us</a> and we'll arrange delivery within Addis Ababa.</p>

<h2>Timelines</h2>
<p>Because every garment is cut and finished specifically for you, production timelines vary by order — we'll confirm an estimated completion date once your order or fitting is booked.</p>

<h2>Questions</h2>
<p>Reach out any time — see our <a href="/faq">FAQ</a> or <a href="/contact">contact us</a> directly.</p>
`.trim();

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const pages = [
      {
        slug: 'faq',
        content: { seoTitle: 'FAQ — Lugo Tailoring', seoDescription: 'Frequently asked questions about ordering, bespoke vs. made-to-measure, payment, and more.', eyebrow: 'Help', heading: 'Frequently Asked Questions', lastUpdated: LAST_UPDATED, body: FAQ_BODY },
      },
      {
        slug: 'shipping-delivery',
        content: { seoTitle: 'Shipping & Delivery — Lugo Tailoring', seoDescription: 'How pickup and delivery works for Lugo Tailoring garments.', eyebrow: 'Help', heading: 'Shipping & Delivery', lastUpdated: LAST_UPDATED, body: SHIPPING_BODY },
      },
    ];

    // The corresponding migration (20260101000023) already inserts these rows
    // on databases upgraded from an install that predates this seeder — skip
    // any slug that's already present so this stays safe to run either way.
    for (const p of pages) {
      // eslint-disable-next-line no-await-in-loop
      const [existing] = await queryInterface.sequelize.query('SELECT id FROM pages WHERE slug = ?', {
        replacements: [p.slug],
      });
      if (existing.length) continue;

      // eslint-disable-next-line no-await-in-loop
      await queryInterface.bulkInsert('pages', [
        { slug: p.slug, content: JSON.stringify(p.content), created_at: now, updated_at: now },
      ]);
    }
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('pages', { slug: ['faq', 'shipping-delivery'] });
  },
};
