module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const fabrics = [
      {
        name: 'Charcoal Wool Twill',
        description: 'Super 130s wool twill in deep charcoal — a versatile foundation for boardroom and evening wear.',
        material: '100% Wool (Super 130s)',
        color: 'Charcoal',
        image_url: '/images/fabrics/charcoal-wool-twill.svg',
        price_cents: 480000,
        in_stock: true,
        sort_order: 1,
      },
      {
        name: 'Midnight Blue Herringbone',
        description: 'A subtle herringbone weave in midnight blue with a soft hand and natural stretch.',
        material: '95% Wool / 5% Cashmere',
        color: 'Midnight Blue',
        image_url: '/images/fabrics/midnight-herringbone.svg',
        price_cents: 620000,
        in_stock: true,
        sort_order: 2,
      },
      {
        name: 'Dove Grey Sharkskin',
        description: 'Crisp sharkskin weave with a two-tone shimmer, ideal for formal daywear.',
        material: '100% Wool',
        color: 'Dove Grey',
        image_url: '/images/fabrics/dove-grey-sharkskin.svg',
        price_cents: 510000,
        in_stock: true,
        sort_order: 3,
      },
      {
        name: 'Bordeaux Flannel',
        description: 'Heavyweight flannel in rich bordeaux — soft, warm, and made for cooler months.',
        material: '100% Wool Flannel',
        color: 'Bordeaux',
        image_url: '/images/fabrics/bordeaux-flannel.svg',
        price_cents: 560000,
        in_stock: true,
        sort_order: 4,
      },
      {
        name: 'Sand Linen Blend',
        description: 'Breathable linen-wool blend in warm sand, tailored for summer occasions.',
        material: '55% Linen / 45% Wool',
        color: 'Sand',
        image_url: '/images/fabrics/sand-linen-blend.svg',
        price_cents: 495000,
        in_stock: true,
        sort_order: 5,
      },
      {
        name: 'Forest Green Flannel',
        description: 'A statement flannel in deep forest green with a brushed, matte finish.',
        material: '100% Wool Flannel',
        color: 'Forest Green',
        image_url: '/images/fabrics/forest-green-flannel.svg',
        price_cents: 575000,
        in_stock: true,
        sort_order: 6,
      },
    ].map((f) => ({ ...f, created_at: now, updated_at: now }));

    await queryInterface.bulkInsert('fabrics', fabrics);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('fabrics', {});
  },
};
