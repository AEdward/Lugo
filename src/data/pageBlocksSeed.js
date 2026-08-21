'use strict';

// Shared block data for the pages whose body sections were converted from
// hardcoded EJS markup into admin-editable blocks (see
// src/views/partials/blocks.ejs). It's a 1:1 translation of the markup it
// replaced, so pages render identically until an admin edits them.
//
// Used by both src/seeders/20260101000014-seed-pages.js (fresh installs,
// where this is baked into the initial insert) and
// src/migrations/20260101000020-seed-page-blocks.js (existing installs,
// where the Page rows already exist from before blocks existed and need a
// backfill instead). Gallery and Contact aren't included — their body
// content is either database-driven (gallery images) or a functional form,
// not static copy.

module.exports = {
  home: [
    {
      id: 'home-lugo-standard',
      type: 'heading-features',
      data: {
        eyebrow: 'The Lugo Standard',
        heading: 'Tailoring, made personal.',
        text: 'Every Lugo piece is designed around you — your measurements, your style, your occasion, and the details that make the garment yours.',
        items: [
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
            number: '01',
            title: 'Handcrafted',
            text: 'Cut and finished with attention to every detail.',
          },
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="1"/><line x1="7" y1="8" x2="7" y2="11"/><line x1="11" y1="8" x2="11" y2="11"/><line x1="15" y1="8" x2="15" y2="11"/><line x1="19" y1="8" x2="19" y2="11"/></svg>',
            number: '02',
            title: 'Made to Measure',
            text: 'A precise fit based on your individual measurements.',
          },
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="7" ry="2.5"/><ellipse cx="12" cy="19" rx="7" ry="2.5"/><path d="M5 5v14"/><path d="M19 5v14"/><path d="M8 9c2 1.5 6 1.5 8 0"/><path d="M8 15c2-1.5 6-1.5 8 0"/></svg>',
            number: '03',
            title: 'Personalised',
            text: 'Choose your fabric, silhouette, lining, buttons and finishing details.',
          },
        ],
      },
    },
    {
      id: 'home-banners',
      type: 'banner',
      data: {
        items: [
          {
            src: '/images/gallery/gallery-1.png',
            textPosition: 'right',
            eyebrow: 'Bespoke',
            heading: 'Created entirely from scratch.',
            text: 'A fully personalised garment built around your measurements, posture and preferences.',
            buttonLabel: 'Explore Bespoke →',
            buttonHref: '/bespoke',
          },
          {
            src: '/images/gallery/gallery-5.png',
            textPosition: 'right',
            eyebrow: 'Made-to-Measure',
            heading: 'Refined from an existing silhouette.',
            text: 'Select your preferred style and customise the fit, fabric and details.',
            buttonLabel: 'Explore Made-to-Measure →',
            buttonHref: '/store',
          },
        ],
      },
    },
    {
      id: 'home-art-of-suit',
      type: 'image-text',
      data: {
        images: ['/images/gallery/gallery-3.png', '/images/about-atelier.png'],
        alt: 'The craft behind a Lugo garment',
        imagePosition: 'right',
        eyebrow: 'The Art of the Suit',
        heading: 'More than a suit. A garment made around you.',
        paragraphs: [
          {
            text: 'From the first measurement to the final fitting, every Lugo garment passes through a carefully considered process.',
            soft: true,
          },
        ],
        buttonLabel: 'Discover Our Craft →',
        buttonHref: '/bespoke',
      },
    },
    {
      id: 'home-collections',
      type: 'collection-grid',
      data: {
        eyebrow: 'Our Collections',
        items: [
          { src: '/images/gallery/gallery-1.png', title: 'The Executive', text: 'Sharp. Refined. Effortless.', href: '/store' },
          { src: '/images/gallery/gallery-4.png', title: 'The Classic', text: 'Timeless tailoring for every occasion.', href: '/store' },
          { src: '/images/gallery/gallery-2.png', title: 'The Evening', text: 'Tuxedos and formalwear crafted for the moments that matter.', href: '/store' },
          { src: '/images/gallery/gallery-6.png', title: 'The Weekend', text: 'Relaxed tailoring with the same attention to detail.', href: '/store' },
        ],
      },
    },
    {
      id: 'home-process',
      type: 'process-timeline',
      data: {
        eyebrow: 'The Lugo Process',
        heading: 'Your journey, tailored.',
        steps: [
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
            label: 'Consultation',
            text: 'Tell us what you\'re looking for.',
          },
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="1"/><line x1="7" y1="8" x2="7" y2="11"/><line x1="11" y1="8" x2="11" y2="11"/><line x1="15" y1="8" x2="15" y2="11"/><line x1="19" y1="8" x2="19" y2="11"/></svg>',
            label: 'Measurement',
            text: 'We take your precise measurements and understand your posture and proportions.',
          },
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
            label: 'Design',
            text: 'Choose your fabric, cut, lining, buttons and finishing details.',
          },
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 4 6l2 3v12h12V9l2-3-4-3-4 2-4-2Z"/></svg>',
            label: 'Fitting',
            text: 'We refine the garment until the fit is right.',
          },
          {
            icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3"/><line x1="12" y1="5" x2="12" y2="21"/><path d="M12 5c-1-3-6-3-6 0s5 0 6 0Z"/><path d="M12 5c1-3 6-3 6 0s-5 0-6 0Z"/></svg>',
            label: 'Final Garment',
            text: 'Your finished Lugo piece, made specifically for you.',
          },
        ],
      },
    },
    {
      id: 'home-details',
      type: 'detail-grid',
      data: {
        eyebrow: 'Choose Your Details',
        heading: 'Your suit should look like you.',
        items: [
          { src: '/images/fabrics/charcoal-wool-twill.png', label: 'Fabric', caption: 'Wool · Linen · Cashmere · Silk' },
          { src: '/images/options/lapel-notch.png', label: 'Lapel', caption: 'Notch · Peak · Shawl' },
          { src: '/images/options/buttons-double.png', label: 'Buttons', caption: 'Horn · Mother of Pearl · Metal' },
          { src: '/images/options/lining-classic-black.png', label: 'Lining', caption: 'Classic · Signature · Personalised' },
        ],
      },
    },
    {
      id: 'home-testimonials',
      type: 'testimonials',
      data: {
        eyebrow: 'Client Experience',
        items: [
          { quote: 'The fit was exceptional. Every detail felt considered.', name: 'Henok T.', role: 'Lugo Bespoke Client' },
          { quote: 'The process was seamless, and the result is a suit I truly love.', name: 'Abel M.', role: 'Lugo Bespoke Client' },
          { quote: "Best tailoring experience I've ever had.", name: 'Dawit A.', role: 'Lugo Bespoke Client' },
        ],
      },
    },
    {
      id: 'home-final-cta',
      type: 'cta',
      data: {
        backgroundImage: '/images/gallery/gallery-5.png',
        heading: 'Your next suit should fit you.',
        text: "Whether you're preparing for a wedding, building your wardrobe, or looking for something truly personal, let's create it together.",
        maxWidth: 520,
        textMargin: 28,
        buttons: [
          { label: 'Book a Fitting', href: '/booking', style: 'accent' },
          { label: 'Design Your Suit', href: '/store', style: 'outline' },
        ],
      },
    },
  ],
  about: [
    {
      id: 'about-craftsmanship',
      type: 'image-text',
      data: {
        src: '/images/about-atelier.png',
        alt: 'Lugo Tailoring atelier',
        imagePosition: 'left',
        eyebrow: 'Craftsmanship',
        heading: 'Every stitch, considered.',
        paragraphs: [
          {
            text: 'Our tailors bring together decades of experience with a modern, client-first process. Each garment begins with a conversation — about how you live, how you move, and how you want to look — before a single measurement is taken.',
            soft: false,
          },
          {
            text: 'From fabric sourcing to the final fitting, every step happens with the same attention to detail that has defined bespoke tailoring for generations.',
            soft: false,
          },
        ],
      },
    },
    {
      id: 'about-standard',
      type: 'feature-grid',
      data: {
        eyebrow: 'What We Believe',
        heading: 'The Lugo Standard',
        columns: 3,
        sectionStyle: 'alt',
        items: [
          { icon: '✦', title: 'Precision Fit', text: 'Every order is built from your exact measurements — no standard sizing, ever.' },
          { icon: '✦', title: 'Honest Materials', text: "We work only with mills and fabrics we'd choose for ourselves." },
          { icon: '✦', title: 'Personal Service', text: 'From your first fitting to final delivery, you work with the same dedicated team.' },
        ],
      },
    },
    {
      id: 'about-cta',
      type: 'cta',
      data: {
        heading: 'Come visit the studio',
        text: "Book a consultation and let's start designing your next suit together.",
        maxWidth: 480,
        textMargin: 24,
        buttons: [{ label: 'Book an Appointment', href: '/booking', style: 'primary' }],
      },
    },
  ],
  bespoke: [
    {
      id: 'bespoke-process',
      type: 'feature-grid',
      data: {
        eyebrow: 'The Process',
        heading: 'From Consultation to Final Fitting',
        columns: 3,
        paddingTop: true,
        items: [
          { icon: '01', title: 'Consultation', text: 'We start with a conversation about how you live, what you need the suit for, and the silhouette you want — no measurements yet.' },
          { icon: '02', title: 'Pattern & Cutting', text: 'A single tailor drafts your pattern from scratch and hand-cuts your cloth. Nothing is copied from a standard block.' },
          { icon: '03', title: 'Fittings', text: 'Multiple fitting sessions refine the shape as the garment is built, adjusting balance, drape, and proportion by hand.' },
          { icon: '04', title: 'Hand Finishing', text: 'Buttonholes, lapels, and linings are finished by hand in our workshop — the details that separate bespoke from everything else.' },
          { icon: '05', title: 'Delivery', text: 'Your finished suit is presented and fitted one final time, with any last adjustments made on the spot.' },
          { icon: '06', title: 'Aftercare', text: 'Your pattern stays on file. Future pieces — and alterations — start from a pattern that already fits you perfectly.' },
        ],
      },
    },
    {
      id: 'bespoke-made-in-house',
      type: 'image-text',
      data: {
        src: '/images/about-atelier.png',
        alt: 'Lugo Tailoring workshop',
        imagePosition: 'left',
        sectionStyle: 'alt',
        eyebrow: 'Made In-House',
        heading: 'Every stitch happens in our workshop.',
        paragraphs: [
          {
            text: 'Bespoke tailoring, done properly, cannot be rushed or outsourced. Your cutter, your tailor, and your finisher work from the same studio, on the same garment, from first cut to final press.',
            soft: false,
          },
          {
            text: 'If you already know your measurements and want to move faster, our <a href="/store">Made-to-Measure store</a> lets you configure a suit online and skip straight to production.',
            soft: true,
          },
        ],
      },
    },
    {
      id: 'bespoke-cta',
      type: 'cta',
      data: {
        heading: 'Begin with a conversation',
        text: "Book a bespoke consultation and we'll take it from there — no measurements required to get started.",
        maxWidth: 480,
        textMargin: 28,
        buttons: [{ label: 'Book a Consultation', href: '/booking', style: 'primary' }],
      },
    },
  ],
};
