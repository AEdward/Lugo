const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { Fabric, DesignOption, Order } = require('../models');
const cartService = require('../services/cartService');
const chapaService = require('../services/chapaService');
const notificationService = require('../services/notificationService');
const { markOrderGroupPaid } = require('../services/orderPaymentService');
const { decrementStockForOrders } = require('../services/stockService');
const newsletterService = require('../services/newsletterService');
const settingsService = require('../services/settingsService');
const receiptUpload = require('../middleware/receiptUpload');
const { doubleCsrfProtection } = require('../middleware/csrf');
const { checkoutLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const MEASUREMENT_FIELDS = [
  'height', 'weight', 'chest', 'waist', 'hips', 'shoulder', 'sleeveLength', 'neck', 'inseam',
];

function optionsByCategory(options) {
  return options.reduce((map, o) => {
    if (!map[o.category]) map[o.category] = [];
    map[o.category].push(o);
    return map;
  }, {});
}

router.get('/store', async (req, res, next) => {
  try {
    const fabrics = await Fabric.findAll({ where: { inStock: true }, order: [['sortOrder', 'ASC']] });
    res.render('store/index', { title: 'Store — Lugo Tailoring', fabrics });
  } catch (err) {
    next(err);
  }
});

router.get('/store/fabrics/:id', async (req, res, next) => {
  try {
    const fabric = await Fabric.findByPk(req.params.id);
    if (!fabric) return res.status(404).render('errors/404', { title: 'Not found' });

    const options = await DesignOption.findAll({ order: [['category', 'ASC'], ['sortOrder', 'ASC']] });
    res.render('store/product', {
      title: `${fabric.name} — Lugo Tailoring`,
      fabric,
      optionGroups: optionsByCategory(options),
      measurementFields: MEASUREMENT_FIELDS,
      errors: [],
      values: {},
      outOfStock: !fabric.inStock,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/store/fabrics/:id/add-to-cart',
  [
    ...MEASUREMENT_FIELDS.map((f) =>
      body(`measurements[${f}]`).trim().notEmpty().isFloat({ min: 1 }).withMessage(`Please enter your ${f}.`)
    ),
    body('notes').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res, next) => {
    try {
      const fabric = await Fabric.findByPk(req.params.id);
      if (!fabric) return res.status(404).render('errors/404', { title: 'Not found' });

      const errors = validationResult(req);
      const options = await DesignOption.findAll({ order: [['category', 'ASC'], ['sortOrder', 'ASC']] });

      if (!fabric.inStock) {
        return res.status(400).render('store/product', {
          title: `${fabric.name} — Lugo Tailoring`,
          fabric,
          optionGroups: optionsByCategory(options),
          measurementFields: MEASUREMENT_FIELDS,
          errors: [{ msg: 'This fabric is currently out of stock.' }],
          values: req.body,
          outOfStock: true,
        });
      }

      if (!errors.isEmpty()) {
        return res.status(400).render('store/product', {
          title: `${fabric.name} — Lugo Tailoring`,
          fabric,
          optionGroups: optionsByCategory(options),
          measurementFields: MEASUREMENT_FIELDS,
          errors: errors.array(),
          values: req.body,
          outOfStock: false,
        });
      }

      const optionIds = Object.values(req.body.optionIds || {})
        .flat()
        .map((v) => parseInt(v, 10))
        .filter((v) => !Number.isNaN(v));

      const measurements = {};
      MEASUREMENT_FIELDS.forEach((f) => {
        measurements[f] = parseFloat(req.body.measurements?.[f]);
      });

      cartService.addItem(req, {
        fabricId: fabric.id,
        optionIds,
        measurements,
        notes: (req.body.notes || '').trim(),
      });

      res.redirect('/cart');
    } catch (err) {
      next(err);
    }
  }
);

router.get('/cart', async (req, res, next) => {
  try {
    const cart = cartService.getCart(req);
    const details = await cartService.buildCartDetails(cart);
    res.render('store/cart', { title: 'Your Cart — Lugo Tailoring', ...details });
  } catch (err) {
    next(err);
  }
});

router.post('/cart/remove/:itemId', (req, res) => {
  cartService.removeItem(req, req.params.itemId);
  res.redirect('/cart');
});

router.get('/checkout', async (req, res, next) => {
  try {
    const cart = cartService.getCart(req);
    const details = await cartService.buildCartDetails(cart);
    if (details.items.length === 0) return res.redirect('/store');
    const siteSettings = await settingsService.getSiteSettings();
    res.render('store/checkout', {
      title: 'Checkout — Lugo Tailoring',
      ...details,
      bankTransferDetails: siteSettings.bankTransferDetails,
      cashPaymentInstructions: siteSettings.cashPaymentInstructions,
      errors: [],
      values: req.session.customer
        ? { customerName: req.session.customer.name, email: req.session.customer.email, phone: req.session.customer.phone || '', paymentMethod: 'chapa' }
        : { paymentMethod: 'chapa' },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/checkout',
  checkoutLimiter,
  [
    body('customerName').trim().notEmpty().withMessage('Please enter your full name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('phone').trim().notEmpty().withMessage('Please enter a phone number.'),
    body('paymentMethod').isIn(['chapa', 'cash', 'bank_transfer']).withMessage('Please choose a payment method.'),
  ],
  async (req, res, next) => {
    try {
      const cart = cartService.getCart(req);
      const details = await cartService.buildCartDetails(cart);
      if (details.items.length === 0) return res.redirect('/store');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const siteSettings = await settingsService.getSiteSettings();
        return res.status(400).render('store/checkout', {
          title: 'Checkout — Lugo Tailoring',
          ...details,
          bankTransferDetails: siteSettings.bankTransferDetails,
          cashPaymentInstructions: siteSettings.cashPaymentInstructions,
          errors: errors.array(),
          values: req.body,
        });
      }

      const { customerName, email, phone, paymentMethod } = req.body;
      const txRef = `lugo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const createdOrders = await Order.bulkCreate(
        details.items.map((item) => ({
          orderNumber: `LT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          customerId: req.session.customerId || null,
          customerName,
          email,
          phone,
          fabricId: item.fabric.id,
          selectedOptions: item.selectedOptions,
          measurements: item.measurements,
          notes: item.notes,
          subtotalCents: item.lineTotalCents,
          totalCents: item.lineTotalCents,
          currency: 'ETB',
          paymentStatus: 'pending',
          status: 'pending_payment',
          chapaTxRef: txRef,
          paymentMethod,
          receiptStatus: paymentMethod === 'bank_transfer' ? 'awaiting_upload' : 'not_applicable',
        }))
      );

      // Reserve stock as soon as the order is placed (not only once paid) —
      // otherwise a finite-stock fabric could be oversold during the window
      // where a Chapa/bank-transfer payment is still pending.
      decrementStockForOrders(createdOrders).catch(() => {});

      if (req.body.newsletter) {
        newsletterService.subscribe(email, 'checkout').catch(() => {});
      }

      if (paymentMethod !== 'chapa') {
        // Cash and bank transfer are settled in person / manually by an
        // admin — no external payment gateway involved.
        cartService.clearCart(req);
        return res.redirect(`/order/confirmation/${encodeURIComponent(txRef)}`);
      }

      const [firstName, ...rest] = customerName.trim().split(' ');
      const amountBirr = (details.totalCents / 100).toFixed(2);

      const chapaResponse = await chapaService.initializeTransaction({
        txRef,
        amount: amountBirr,
        currency: 'ETB',
        email,
        firstName: firstName || customerName,
        lastName: rest.join(' ') || '.',
        callbackUrl: `${process.env.BASE_URL}/order/webhook`,
        returnUrl: `${process.env.BASE_URL}/order/return?tx_ref=${encodeURIComponent(txRef)}`,
        title: 'Lugo Suit',
        description: `Custom suit order - ${createdOrders.length} item${createdOrders.length === 1 ? '' : 's'}`,
      });

      if (chapaResponse.status !== 'success' || !chapaResponse.data?.checkout_url) {
        throw new Error(chapaResponse.message || 'Unable to start payment with Chapa.');
      }

      await Order.update(
        { chapaCheckoutUrl: chapaResponse.data.checkout_url },
        { where: { chapaTxRef: txRef } }
      );

      cartService.clearCart(req);
      res.redirect(chapaResponse.data.checkout_url);
    } catch (err) {
      next(err);
    }
  }
);

// Confirmation page for cash / bank transfer orders — these never go
// through Chapa, so there's nothing to verify, unlike /order/return.
router.get('/order/confirmation/:txRef', async (req, res, next) => {
  try {
    const orders = await Order.findAll({ where: { chapaTxRef: req.params.txRef }, include: [Fabric] });
    if (orders.length === 0) return res.redirect('/store');

    res.render('store/order-confirmation', {
      title: 'Order Confirmation — Lugo Tailoring',
      orders,
      paid: orders[0].paymentStatus === 'paid',
      txRef: req.params.txRef,
      receiptError: null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/order/confirmation/:txRef/receipt', (req, res, next) => {
  receiptUpload.single('receipt')(req, res, (err) => {
    if (err) {
      return Order.findAll({ where: { chapaTxRef: req.params.txRef }, include: [Fabric] }).then((orders) =>
        res.status(400).render('store/order-confirmation', {
          title: 'Order Confirmation — Lugo Tailoring',
          orders,
          paid: orders.length > 0 && orders[0].paymentStatus === 'paid',
          txRef: req.params.txRef,
          receiptError: err.message,
        })
      );
    }

    // req.body is only populated once multer (above) has parsed the
    // multipart form, so the CSRF token can only be checked after this point.
    doubleCsrfProtection(req, res, async (csrfErr) => {
      if (csrfErr) return next(csrfErr);

      try {
        const orders = await Order.findAll({ where: { chapaTxRef: req.params.txRef } });
        if (orders.length === 0 || !req.file) return res.redirect(`/order/confirmation/${req.params.txRef}`);

        await Order.update(
          { receiptUrl: `/uploads/${req.file.filename}`, receiptStatus: 'pending_review' },
          { where: { chapaTxRef: req.params.txRef } }
        );

        notificationService
          .notifyAdmin({
            type: 'receipt_uploaded',
            title: `Bank transfer receipt uploaded — ${orders[0].customerName}`,
            body: 'Review the receipt and mark the order paid, unpaid, or invalid.',
            link: `/admin/orders/${orders[0].id}`,
          })
          .catch(() => {});

        res.redirect(`/order/confirmation/${req.params.txRef}`);
      } catch (err2) {
        next(err2);
      }
    });
  });
});

// Chapa calls this server-to-server after payment completes.
router.post('/order/webhook', express.json(), async (req, res) => {
  try {
    const txRef = req.body.tx_ref;
    if (txRef) await settleOrdersForTxRef(txRef);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[chapa-webhook] failed', err);
    res.status(200).json({ received: true });
  }
});

// Customer is redirected here after completing (or abandoning) checkout.
router.get('/order/return', async (req, res, next) => {
  try {
    const txRef = req.query.tx_ref;
    if (!txRef) return res.redirect('/store');

    const orders = await settleOrdersForTxRef(txRef);
    res.render('store/order-confirmation', {
      title: 'Order Confirmation — Lugo Tailoring',
      orders,
      paid: orders.length > 0 && orders[0].paymentStatus === 'paid',
      txRef,
      receiptError: null,
    });
  } catch (err) {
    next(err);
  }
});

async function settleOrdersForTxRef(txRef) {
  const orders = await Order.findAll({ where: { chapaTxRef: txRef }, include: [Fabric] });
  if (orders.length === 0) return [];
  if (orders[0].paymentStatus === 'paid') return orders;

  const verification = await chapaService.verifyTransaction(txRef);
  const paid = verification.status === 'success' && verification.data?.status === 'success';

  if (paid) return markOrderGroupPaid(txRef);

  return orders;
}

module.exports = router;
