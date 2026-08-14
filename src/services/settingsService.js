const { Setting } = require('../models');

async function get(key, fallback = null) {
  const row = await Setting.findOne({ where: { key } });
  return row ? row.value : fallback;
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

module.exports = { get, set, unset };
