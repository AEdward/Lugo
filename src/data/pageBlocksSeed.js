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
