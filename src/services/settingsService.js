const { Op } = require('sequelize');
const { Setting } = require('../models');

const SITE_SETTING_DEFAULTS = {
  siteName: 'Lugo Tailoring',
  contactEmail: 'hello@lugotailoring.com',
  contactPhone: '+251 00 000 0000',
  contactAddress: '',
  socialFacebook: '',
  socialInstagram: '',
  socialTiktok: '',
};

async function get(key, fallback = null) {
  const row = await Setting.findOne({ where: { key } });
  return row ? row.value : fallback;
}

async function getSiteSettings() {
  const rows = await Setting.findAll({ where: { key: { [Op.in]: Object.keys(SITE_SETTING_DEFAULTS) } } });
  const overrides = {};
  rows.forEach((row) => {
    overrides[row.key] = row.value;
  });
  return { ...SITE_SETTING_DEFAULTS, ...overrides };
}

async function set(key, value) {
  const [row] = await Setting.findOrCreate({ where: { key }, defaults: { value } });
  if (row.value !== value) {
    row.value = value;
    await row.save();
  }
  return row;
}

async function unset(key) {
  await Setting.destroy({ where: { key } });
}

module.exports = { get, set, unset, getSiteSettings, SITE_SETTING_DEFAULTS };
