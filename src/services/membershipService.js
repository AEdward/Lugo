const settingsService = require('./settingsService');
const { Order } = require('../models');

const TIER_LABELS = { 0: 'New Customer', 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };

async function getThresholds() {
  const settings = await settingsService.getSiteSettings();
  return {
    tier1Min: parseInt(settings.tier1Min, 10) || 1,
    tier2Min: parseInt(settings.tier2Min, 10) || 5,
    tier3Min: parseInt(settings.tier3Min, 10) || 10,
  };
}

function computeTier(paidOrderCount, thresholds) {
  if (paidOrderCount >= thresholds.tier3Min) return 3;
  if (paidOrderCount >= thresholds.tier2Min) return 2;
  if (paidOrderCount >= thresholds.tier1Min) return 1;
  return 0;
}

async function getTierForCustomer(customerId) {
  const [thresholds, paidOrderCount] = await Promise.all([
    getThresholds(),
    Order.count({ where: { customerId, paymentStatus: 'paid' } }),
  ]);
  const tier = computeTier(paidOrderCount, thresholds);
  return { tier, label: TIER_LABELS[tier], paidOrderCount };
}

module.exports = { getThresholds, computeTier, getTierForCustomer, TIER_LABELS };
