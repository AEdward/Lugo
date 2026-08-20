const express = require('express');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { Fabric, DesignOption, Order } = require('../models');
const cartService = require('../services/cartService');
const chapaService = require('../services/chapaService');
const notifications = require('../services/notifications');

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

      if (!errors.isEmpty()) {
        return res.status(400).render('store/product', {
          title: `${fabric.name} — Lugo Tailoring`,
          fabric,
          optionGroups: optionsByCategory(options),
          measurementFields: MEASUREMENT_FIELDS,
          errors: errors.array(),
          values: req.body,
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
    res.render('store/checkout', {
      title: 'Checkout — Lugo Tailoring',
      ...details,
      errors: [],
      values: {},
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/checkout',
  [
    body('customerName').trim().notEmpty().withMessage('Please enter your full name.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email.'),
    body('phone').trim().notEmpty().withMessage('Please enter a phone number.'),
  ],
  async (req, res, next) => {
    try {
      const cart = cartService.getCart(req);
      const details = await cartService.buildCartDetails(cart);
      if (details.items.length === 0) return res.redirect('/store');

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render('store/checkout', {
          title: 'Checkout — Lugo Tailoring',
          ...details,
          errors: errors.array(),
          values: req.body,
        });
      }

      const { customerName, email, phone } = req.body;
      const txRef = `lugo-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

      const createdOrders = await Order.bulkCreate(
        details.items.map((item) => ({
          orderNumber: `LT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
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
        }))
      );

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

  if (paid) {
    // The webhook and the customer's return-redirect can both reach this
    // around the same time — only the request that actually flips the row
    // (not already 'paid') should send notifications, or a race sends two.
    const [affectedCount] = await Order.update(
      { paymentStatus: 'paid', status: 'paid' },
      { where: { chapaTxRef: txRef, paymentStatus: { [Op.ne]: 'paid' } } }
    );
    const paidOrders = await Order.findAll({ where: { chapaTxRef: txRef }, include: [Fabric] });
    if (affectedCount > 0) {
      notifications.sendOrdersPaid(paidOrders).catch(() => {});
      notifications.notifyAdminNewOrders(paidOrders).catch(() => {});
    }
    return paidOrders;
  }

  return orders;
}

module.exports = router;
