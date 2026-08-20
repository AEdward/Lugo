const { Op } = require('sequelize');
const { PageView } = require('../models');

const DAY_MS = 24 * 60 * 60 * 1000;

async function getSummary() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [today, last7, last30, allTime, recentViews] = await Promise.all([
    PageView.count({ where: { createdAt: { [Op.gte]: startOfDay } } }),
    PageView.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
    PageView.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
    PageView.count(),
    PageView.findAll({
      where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
      attributes: ['path', 'referrer', 'visitorHash', 'createdAt'],
      raw: true,
    }),
  ]);

  const pathCounts = {};
  const referrerCounts = {};
  const dayCounts = {};
  const uniqueVisitors = new Set();

  recentViews.forEach((v) => {
    pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;
    uniqueVisitors.add(v.visitorHash);

    const day = new Date(v.createdAt).toISOString().slice(0, 10);
    dayCounts[day] = (dayCounts[day] || 0) + 1;

    if (v.referrer) {
      try {
        const host = new URL(v.referrer).host;
        if (host) referrerCounts[host] = (referrerCounts[host] || 0) + 1;
      } catch {
        // Malformed/relative referrer — skip rather than fail the whole page.
      }
    }
  });

  const topPages = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([host, count]) => ({ host, count }));

  const dailySeries = [];
  for (let i = 13; i >= 0; i -= 1) {
    const key = new Date(now.getTime() - i * DAY_MS).toISOString().slice(0, 10);
    dailySeries.push({ date: key, count: dayCounts[key] || 0 });
  }
  const maxDaily = Math.max(1, ...dailySeries.map((d) => d.count));

  return {
    today,
    last7,
    last30,
    allTime,
    uniqueVisitors30d: uniqueVisitors.size,
    topPages,
    topReferrers,
    dailySeries,
    maxDaily,
  };
}

module.exports = { getSummary };
