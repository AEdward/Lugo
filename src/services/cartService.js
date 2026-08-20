const { v4: uuidv4 } = require('uuid');
const { Fabric, DesignOption } = require('../models');

function getCart(req) {
  if (!req.session.cart) req.session.cart = [];
  return req.session.cart;
}

function addItem(req, item) {
  const cart = getCart(req);
  cart.push({ id: uuidv4(), ...item });
  return cart;
}

function removeItem(req, itemId) {
  req.session.cart = getCart(req).filter((i) => i.id !== itemId);
  return req.session.cart;
}

function clearCart(req) {
  req.session.cart = [];
}

/**
 * Resolves raw cart items (fabricId, optionIds) against the DB and computes pricing.
 * Returns { items: [...enriched], subtotalCents, totalCents } — items missing their
 * fabric (e.g. deleted/out of stock) are dropped.
 */
async function buildCartDetails(cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return { items: [], subtotalCents: 0, totalCents: 0 };
  }

  const fabricIds = [...new Set(cartItems.map((i) => i.fabricId))];
  const optionIds = [...new Set(cartItems.flatMap((i) => i.optionIds || []))];

  const [fabrics, options] = await Promise.all([
    Fabric.findAll({ where: { id: fabricIds } }),
    DesignOption.findAll({ where: { id: optionIds } }),
  ]);

  const fabricMap = new Map(fabrics.map((f) => [f.id, f]));
  const optionMap = new Map(options.map((o) => [o.id, o]));

  const items = [];
  let subtotalCents = 0;

  for (const raw of cartItems) {
    const fabric = fabricMap.get(raw.fabricId);
    if (!fabric || !fabric.inStock) continue;

    const selectedOptions = (raw.optionIds || [])
      .map((id) => optionMap.get(id))
      .filter(Boolean)
      .map((o) => ({ id: o.id, category: o.category, name: o.name, priceCents: o.priceCents, imageUrl: o.imageUrl }));

    const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.priceCents, 0);
    const lineTotal = fabric.priceCents + optionsTotal;
    subtotalCents += lineTotal;

    items.push({
      id: raw.id,
      fabric,
      selectedOptions,
      measurements: raw.measurements || {},
      notes: raw.notes || '',
      lineTotalCents: lineTotal,
    });
  }

  return { items, subtotalCents, totalCents: subtotalCents };
}

module.exports = { getCart, addItem, removeItem, clearCart, buildCartDetails };
