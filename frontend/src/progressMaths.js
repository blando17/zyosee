/*
 * The arithmetic behind the progress page.
 *
 * Kept apart from the component because every function here is pure: give it
 * the same data and it gives the same answer, with no rendering in the way.
 * That matters most for the streak, which is the easiest thing on the page to
 * get quietly wrong.
 *
 * Days are counted in the VIEWER's timezone. The server deliberately sends
 * moments rather than dates, because it runs in a container set to UTC and a
 * streak computed there would roll over at the wrong hour for everybody else.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/*
 * Which day a moment falls on, as an integer, in local time.
 *
 * Rounded rather than truncated because local midnights are not always exactly
 * 24 hours apart — the clocks change twice a year — and a 23 or 25 hour day
 * would otherwise shift every index after it.
 */
export function dayIndex(value) {
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return null;
  return Math.round(new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime() / DAY_MS);
}

export function todayIndex() {
  return dayIndex(Date.now());
}

export function dateFromIndex(index) {
  return new Date(index * DAY_MS + new Date().getTimezoneOffset() * 60 * 1000);
}

/*
 * The run of consecutive days ending today, and the longest run ever.
 *
 * Yesterday still counts towards the current streak. Someone who solved
 * something last night and has not started yet today has not broken anything,
 * and telling them their streak is zero at breakfast would be both wrong and
 * discouraging.
 */
export function streaks(days) {
  const set = new Set(days.filter((d) => d !== null));
  if (!set.size) return { current: 0, best: 0 };

  const sorted = [...set].sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  const today = todayIndex();
  let cursor = set.has(today) ? today : set.has(today - 1) ? today - 1 : null;
  let current = 0;
  while (cursor !== null && set.has(cursor)) {
    current += 1;
    cursor -= 1;
  }

  return { current, best };
}

/* One bucket per day for the last `span` days, oldest first. */
export function dayBuckets(days, span) {
  const counts = new Map();
  for (const day of days) {
    if (day === null) continue;
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  const today = todayIndex();
  const buckets = [];
  for (let i = span - 1; i >= 0; i -= 1) {
    const index = today - i;
    buckets.push({ index, date: dateFromIndex(index), count: counts.get(index) || 0 });
  }
  return buckets;
}

/*
 * The middle value, not the mean.
 *
 * Time-to-solve is measured from the first attempt to the first accept, so a
 * problem somebody left open overnight contributes fourteen hours. One of
 * those would drag a mean somewhere useless; a median shrugs it off.
 */
export function median(numbers) {
  const sorted = numbers.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function mean(numbers) {
  const usable = numbers.filter((n) => Number.isFinite(n));
  if (!usable.length) return null;
  return usable.reduce((total, n) => total + n, 0) / usable.length;
}

/*
 * How much of each topic has been solved.
 *
 * Deliberately "solved out of available" rather than anything called mastery.
 * A judge knows whether a solution was accepted; it does not know whether
 * somebody understood it, and a number claiming otherwise would be made up.
 */
export function topicCoverage(problems, solved) {
  const totals = new Map();
  for (const problem of problems) {
    for (const tag of problem.tags || []) {
      const row = totals.get(tag) || { topic: tag, solved: 0, total: 0 };
      row.total += 1;
      if (solved.has(problem.slug)) row.solved += 1;
      totals.set(tag, row);
    }
  }
  return [...totals.values()]
    .map((row) => ({ ...row, fraction: row.total ? row.solved / row.total : 0 }))
    .sort((a, b) => b.fraction - a.fraction || b.total - a.total || a.topic.localeCompare(b.topic));
}

export const RETENTION_BANDS = [
  { id: "strong", label: "Strong", caption: "practised in the last week", maxDays: 7 },
  { id: "fading", label: "Fading", caption: "practised within the month", maxDays: 30 },
  { id: "rusty", label: "Rusty", caption: "not practised in over a month", maxDays: Infinity },
];

/*
 * Topics sorted into how recently they were last practised.
 *
 * Only topics with at least one solved problem appear. A topic nobody has
 * touched is not rusty — it was never learned, and filing it under "you are
 * forgetting this" would be nonsense.
 */
export function retention(problems, lastSolvedBySlug) {
  const freshest = new Map();

  for (const problem of problems) {
    const when = lastSolvedBySlug[problem.slug];
    if (!when) continue;
    const at = new Date(when).getTime();
    for (const tag of problem.tags || []) {
      if (!freshest.has(tag) || at > freshest.get(tag)) freshest.set(tag, at);
    }
  }

  const bands = RETENTION_BANDS.map((band) => ({ ...band, topics: [] }));
  for (const [topic, at] of freshest) {
    const days = Math.floor((Date.now() - at) / DAY_MS);
    const band = bands.find((candidate) => days <= candidate.maxDays);
    band.topics.push({ topic, days, at });
  }

  for (const band of bands) band.topics.sort((a, b) => a.days - b.days);
  return bands;
}

/* "18m 42s", "2h 05m", "just under a minute". */
export function humanDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  return `${Math.round(hours / 24)}d`;
}
