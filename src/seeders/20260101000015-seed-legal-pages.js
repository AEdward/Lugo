const LEGAL_LAST_UPDATED = 'August 20, 2026';

const TERMS_BODY = `
<h2>1. Agreement to Terms</h2>
<p>These Terms of Service govern your use of the Lugo Tailoring website and the booking, custom fabric, and design ordering services we offer through it. By using this site, booking an appointment, or placing an order, you agree to these terms.</p>

<h2>2. Our Services</h2>
<p>Lugo Tailoring offers bespoke and made-to-measure suit tailoring. Services include in-person consultations and fittings booked through our appointment system, and custom garment orders configured and paid for through our online store.</p>

<h2>3. Appointments &amp; Bookings</h2>
<p>Appointment requests are held for a limited period while we review and confirm them. We reserve the right to reject or reschedule a request if the requested time is unavailable. Please arrive on time — late arrivals may need to be rescheduled.</p>

<h2>4. Orders, Pricing &amp; Payment</h2>
<p>Prices shown in the store are quoted in Ethiopian Birr (ETB) and may change without notice. At checkout you can pay securely online through Chapa, by bank transfer (upload your receipt for us to verify), or in cash in person. An order is only confirmed once payment has been verified.</p>

<h2>5. Custom &amp; Made-to-Measure Orders</h2>
<p>Every garment is cut and produced specifically for you, based on the measurements and design options you provide at checkout. Please double-check your measurements and selections carefully before submitting payment — see our <a href="/refund-policy">Refund &amp; Return Policy</a> for details on how this affects cancellations and returns.</p>

<h2>6. Accounts</h2>
<p>If you create a customer account, you're responsible for keeping your login credentials confidential and for all activity under your account. Let us know immediately if you believe your account has been accessed without your permission.</p>

<h2>7. Intellectual Property</h2>
<p>All content on this site — including text, images, logos, and design assets — belongs to Lugo Tailoring or its licensors and may not be reproduced without permission.</p>

<h2>8. Limitation of Liability</h2>
<p>We aim to deliver every garment to the standard our clients expect, but we do not guarantee the site will be uninterrupted or error-free. To the fullest extent permitted by law, Lugo Tailoring is not liable for indirect or consequential losses arising from your use of the site or our services.</p>

<h2>9. Governing Law</h2>
<p>These terms are governed by the laws of the Federal Democratic Republic of Ethiopia.</p>

<h2>10. Changes to These Terms</h2>
<p>We may update these terms from time to time. Continued use of the site after changes are posted means you accept the updated terms.</p>

<h2>11. Contact</h2>
<p>Questions about these terms? <a href="/contact">Contact us</a> or email <a href="mailto:hello@lugotailoring.com">hello@lugotailoring.com</a>.</p>
`.trim();

const PRIVACY_BODY = `
<h2>1. Information We Collect</h2>
<p>When you book an appointment, place an order, create an account, or contact us, we collect the information you provide directly, which may include:</p>
<ul>
  <li>Your name, email address, and phone number</li>
  <li>Body measurements and design preferences you submit for a custom order</li>
  <li>Messages you send us through the contact form</li>
  <li>Account details, if you create a customer account (your password is stored only as a secure hash, never in plain text)</li>
</ul>

<h2>2. Payment Information</h2>
<p>Payments for store orders are processed by our payment partner, <a href="https://chapa.co" target="_blank" rel="noopener">Chapa</a>, for card and mobile money checkout. If you pay by bank transfer, we ask you to upload a receipt so we can verify it. We never see or store your card or mobile money credentials.</p>

<h2>3. How We Use Your Information</h2>
<ul>
  <li>To schedule and manage your appointments</li>
  <li>To produce and fulfill your custom garment orders</li>
  <li>To send you booking, order, and account-related notifications by email</li>
  <li>To respond to messages you send through the contact form</li>
  <li>To maintain the security of our site and prevent abuse</li>
</ul>

<h2>4. Cookies &amp; Sessions</h2>
<p>We use a session cookie to keep you signed in and to remember your cart while you browse the store. This is required for the site to function and isn't used for advertising or tracking across other websites.</p>

<h2>5. Website Analytics</h2>
<p>We keep basic, self-hosted analytics on this site — the page visited, the referring site (if any), and a one-way hash of your IP address and browser combined with the date. That hash can't be reversed back to your IP address, and we never share this data with any third-party analytics provider. It's used only to understand which pages are popular and roughly how much traffic the site gets.</p>

<h2>6. Sharing Your Information</h2>
<p>We don't sell your personal information. We share it only with the service providers that help us operate — our payment processor (Chapa) to process card/mobile money payments, and our email provider to send booking/order notifications — and only to the extent necessary for them to provide that service.</p>

<h2>7. Data Retention</h2>
<p>We retain booking, order, and account information for as long as your account is active or as needed to provide our services, comply with legal obligations, and resolve disputes.</p>

<h2>8. Your Rights</h2>
<p>You can review and update your profile information at any time from your <a href="/account/settings">account settings</a>. To request a copy of your data, ask us to delete your account, or ask any other question about how we handle your information, <a href="/contact">contact us</a>.</p>

<h2>9. Changes to This Policy</h2>
<p>We may update this policy from time to time. Material changes will be reflected by updating the date at the top of this page.</p>

<h2>10. Contact</h2>
<p>Questions about this policy? <a href="/contact">Contact us</a> or email <a href="mailto:hello@lugotailoring.com">hello@lugotailoring.com</a>.</p>
`.trim();

const REFUND_BODY = `
<h2>1. Custom-Made Garments</h2>
<p>Every garment ordered through our store is cut and produced specifically for you, based on the measurements and design options you submit at checkout. Because of this, made-to-measure orders are generally <strong>not eligible for return or refund</strong> once production has begun, except as described below.</p>

<h2>2. Order Cancellations</h2>
<p>If you need to cancel an order, contact us as soon as possible. If production hasn't yet started, we'll do our best to cancel and refund the order in full. Once your garment is in production, it can no longer be cancelled or refunded.</p>

<h2>3. Defects &amp; Errors</h2>
<p>If your garment arrives with a manufacturing defect, or doesn't match the measurements and design options you submitted, contact us within 7 days of receiving it. We'll review the issue and, at our discretion, offer a free alteration, a remake, or a partial or full refund.</p>

<h2>4. Measurement Accuracy</h2>
<p>Please double-check the measurements and design selections you enter at checkout — we produce your garment exactly to what's submitted. We're not able to offer a free remake for sizing issues caused by measurements that were entered incorrectly, though we're happy to discuss paid alteration options.</p>

<h2>5. Appointment Cancellations</h2>
<p>Booking an appointment doesn't require payment, so there's no fee to cancel or reschedule — just let us know as early as you can so we can offer the slot to another client.</p>

<h2>6. How Refunds Are Issued</h2>
<p>Approved refunds are returned the same way you paid: back to the original card or mobile money account for Chapa payments, by bank transfer for bank transfer payments, or in cash for cash payments. Refunds may take several business days to appear depending on your bank or mobile money provider.</p>

<h2>7. Contact</h2>
<p>To request a cancellation, report a defect, or ask about this policy, <a href="/contact">contact us</a> or email <a href="mailto:hello@lugotailoring.com">hello@lugotailoring.com</a>.</p>
`.trim();

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const pages = [
      {
        slug: 'terms',
        content: { seoTitle: 'Terms of Service — Lugo Tailoring', seoDescription: 'Terms of service for booking appointments and ordering custom suits from Lugo Tailoring.', eyebrow: 'Legal', heading: 'Terms of Service', lastUpdated: LEGAL_LAST_UPDATED, body: TERMS_BODY },
      },
      {
        slug: 'privacy',
        content: { seoTitle: 'Privacy Policy — Lugo Tailoring', seoDescription: 'How Lugo Tailoring collects, uses, and protects your information.', eyebrow: 'Legal', heading: 'Privacy Policy', lastUpdated: LEGAL_LAST_UPDATED, body: PRIVACY_BODY },
      },
      {
        slug: 'refund-policy',
        content: { seoTitle: 'Refund & Return Policy — Lugo Tailoring', seoDescription: 'Cancellation, defect, and refund policy for custom orders from Lugo Tailoring.', eyebrow: 'Legal', heading: 'Refund & Return Policy', lastUpdated: LEGAL_LAST_UPDATED, body: REFUND_BODY },
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
    await queryInterface.bulkDelete('pages', { slug: ['terms', 'privacy', 'refund-policy'] });
  },
};
