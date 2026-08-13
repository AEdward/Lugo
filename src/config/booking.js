function parseWeekdays(value, fallback) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((v) => parseInt(v.trim(), 10))
    .filter((v) => !Number.isNaN(v));
}

module.exports = {
  holdHours: parseInt(process.env.BOOKING_HOLD_HOURS, 10) || 24,
  slotMinutes: parseInt(process.env.BOOKING_SLOT_MINUTES, 10) || 60,
  openHour: parseInt(process.env.BOOKING_OPEN_HOUR, 10) || 10,
  closeHour: parseInt(process.env.BOOKING_CLOSE_HOUR, 10) || 18,
  // 0 = Sunday ... 6 = Saturday
  closedWeekdays: parseWeekdays(process.env.BOOKING_CLOSED_WEEKDAYS, [0, 1]),
};
