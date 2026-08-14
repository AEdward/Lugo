module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const options = [
      // Lapel
      { category: 'lapel', name: 'Notch Lapel', description: 'Classic, versatile notch lapel.', price_cents: 0, sort_order: 1, image_url: '/images/options/lapel-notch.png' },
      { category: 'lapel', name: 'Peak Lapel', description: 'Bold, formal peak lapel.', price_cents: 15000, sort_order: 2, image_url: '/images/options/lapel-peak.png' },
      { category: 'lapel', name: 'Shawl Lapel', description: 'Smooth rounded lapel for eveningwear.', price_cents: 20000, sort_order: 3, image_url: '/images/options/lapel-shawl.png' },

      // Buttons
      { category: 'buttons', name: 'Two Button, Single Breasted', description: 'Timeless single-breasted closure.', price_cents: 0, sort_order: 1, image_url: '/images/options/buttons-two-sb.png' },
      { category: 'buttons', name: 'Three Button, Single Breasted', description: 'A slightly more formal closure.', price_cents: 5000, sort_order: 2, image_url: '/images/options/buttons-three-sb.png' },
      { category: 'buttons', name: 'Double Breasted', description: 'Six-button double-breasted front.', price_cents: 25000, sort_order: 3, image_url: '/images/options/buttons-double.png' },

      // Lining
      { category: 'lining', name: 'Classic Black Lining', description: 'Understated black interior lining.', price_cents: 0, sort_order: 1, image_url: '/images/options/lining-classic-black.png' },
      { category: 'lining', name: 'Burgundy Paisley Lining', description: 'A pop of pattern on the inside.', price_cents: 12000, sort_order: 2, image_url: '/images/options/lining-burgundy-paisley.png' },
      { category: 'lining', name: 'Custom Monogram Lining', description: 'Lining printed with your initials.', price_cents: 18000, sort_order: 3, image_url: '/images/options/lining-monogram.png' },

      // Fit
      { category: 'fit', name: 'Classic Fit', description: 'Comfortable, traditional silhouette.', price_cents: 0, sort_order: 1, image_url: '/images/options/fit-classic.png' },
      { category: 'fit', name: 'Slim Fit', description: 'A tailored, modern silhouette.', price_cents: 0, sort_order: 2, image_url: '/images/options/fit-slim.png' },
      { category: 'fit', name: 'Extra Slim Fit', description: 'Closely tailored for a sharp line.', price_cents: 10000, sort_order: 3, image_url: '/images/options/fit-extra-slim.png' },

      // Monogram
      { category: 'monogram', name: 'No Monogram', description: 'Leave the interior pocket plain.', price_cents: 0, sort_order: 1, image_url: '/images/options/monogram-none.png' },
      { category: 'monogram', name: 'Embroidered Initials', description: 'Hand-embroidered initials on the inside pocket.', price_cents: 8000, sort_order: 2, image_url: '/images/options/monogram-embroidered.png' },

      // Pocket
      { category: 'pocket', name: 'Flap Pockets', description: 'Classic flap-covered pockets.', price_cents: 0, sort_order: 1, image_url: '/images/options/pocket-flap.png' },
      { category: 'pocket', name: 'Jetted Pockets', description: 'Sleek, minimal pocket welts.', price_cents: 10000, sort_order: 2, image_url: '/images/options/pocket-jetted.png' },
      { category: 'pocket', name: 'Patch Pockets', description: 'Casual, structured patch pockets.', price_cents: 8000, sort_order: 3, image_url: '/images/options/pocket-patch.png' },
    ].map((o) => ({ ...o, created_at: now, updated_at: now }));

    await queryInterface.bulkInsert('design_options', options);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('design_options', {});
  },
};
