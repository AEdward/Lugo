module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const images = [
      { title: 'Charcoal Two-Piece', category: 'Suits', image_url: '/images/gallery/gallery-1.png', sort_order: 1 },
      { title: 'Midnight Blue Tuxedo', category: 'Formal', image_url: '/images/gallery/gallery-2.png', sort_order: 2 },
      { title: 'Herringbone Overcoat', category: 'Outerwear', image_url: '/images/gallery/gallery-3.png', sort_order: 3 },
      { title: 'Wedding Party Suiting', category: 'Weddings', image_url: '/images/gallery/gallery-4.png', sort_order: 4 },
      { title: 'Double-Breasted Navy', category: 'Suits', image_url: '/images/gallery/gallery-5.png', sort_order: 5 },
      { title: 'Linen Summer Blazer', category: 'Seasonal', image_url: '/images/gallery/gallery-6.png', sort_order: 6 },
    ].map((g) => ({ ...g, created_at: now, updated_at: now }));

    await queryInterface.bulkInsert('gallery_images', images);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('gallery_images', {});
  },
};
