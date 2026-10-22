// Numeric US-style dates, used everywhere a date is shown. Dates in frontmatter are UTC midnight,
// so they're read back in UTC to avoid shifting a day in western time zones.

const pad = (n) => String(n).padStart(2, '0');

/**
 * Full date, e.g. "06/12/2025".
 */
export function formatDate(date) {
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}/${date.getUTCFullYear()}`;
}

/**
 * Month and day, for lists already grouped by year, e.g. "06/12".
 */
export function formatMonthDay(date) {
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}`;
}

/**
 * Month and year, e.g. "06/2025".
 */
export function formatMonthYear(date) {
  return `${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()}`;
}
