/*
 * "2 days ago", and the shape of the gap it describes.
 *
 * Lives on its own because two places need exactly the same wording: the
 * recency line under each problem in the list, and the recent-submissions list
 * on the profile. Two copies would drift, and "3 days ago" in one place beside
 * "3d" in another looks like a bug.
 */

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function plural(count, unit) {
  return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

export function relativeTime(value) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";

  const gap = Date.now() - then;
  // A clock that is slightly behind the server should not produce "in 3
  // seconds"; anything at or before now reads as just now.
  if (gap < 45 * 1000) return "just now";
  if (gap < HOUR) return plural(Math.round(gap / MINUTE), "minute");
  if (gap < DAY) return plural(Math.round(gap / HOUR), "hour");

  const days = Math.round(gap / DAY);
  if (days === 1) return "yesterday";
  if (days < 30) return plural(days, "day");

  const months = Math.round(days / 30);
  if (months < 12) return plural(months, "month");
  return plural(Math.round(days / 365), "year");
}

/* Whole days since a moment, for deciding when something is going stale. */
export function daysSince(value) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.floor((Date.now() - then) / DAY);
}

/*
 * How long a solved problem stays "fresh" before it is worth another go.
 *
 * Three weeks is a judgement call, not a measurement: long enough that a
 * problem solved this month is not nagging at you, short enough that something
 * from last term is flagged.
 */
export const STALE_AFTER_DAYS = 21;
