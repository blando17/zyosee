/*
 * The words and colours the arena uses, in one place.
 *
 * Four screens describe the same duel — the arena list, the challenge card,
 * the lobby and the match itself — and a mode that is "Random Duel" on one and
 * "Quick Match" on another reads like two different features.
 */

export const DIFFICULTY_TINT = {
  Easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-800 ring-amber-200",
  Hard: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const DIFFICULTY_DOT = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-rose-500",
};

export const MODES = {
  random: {
    label: "Random Duel",
    short: "Random",
    icon: "dice",
    blurb: "The computer picks the problems.",
  },
  custom: {
    label: "Custom Duel",
    short: "Custom",
    icon: "target",
    blurb: "You pick the problems.",
  },
};

export function modeOf(mode) {
  return MODES[mode] || MODES.random;
}

/* mm:ss, and hh:mm:ss only when there is an hour to show. */
export function clockText(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const seconds = String(total % 60).padStart(2, "0");
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
  return `${minutes}:${seconds}`;
}

/* "30 Minutes", for a duel's length rather than its remaining time. */
export function durationText(ms) {
  const minutes = Math.round(ms / 60000);
  return `${minutes} ${minutes === 1 ? "Minute" : "Minutes"}`;
}

export const LANGUAGE_NAMES = { cpp: "C++", c: "C", py: "Python 3", java: "Java" };

export function languageName(value) {
  return LANGUAGE_NAMES[value] || value;
}

/*
 * "2 Easy + 1 Medium" — the only thing a player knows about a random duel
 * before it starts, so it is worth saying clearly.
 */
export function mixText(mix = {}) {
  const parts = [];
  for (const level of ["Easy", "Medium", "Hard"]) {
    if (mix[level]) parts.push(`${mix[level]} ${level}`);
  }
  return parts.join(" + ") || "No problems";
}

/*
 * How hard a match is overall, from what is in it.
 *
 * Deliberately a rough label and not a number. The honest summary of "one Easy
 * and one Hard" is "mixed", and dressing that up as 6.4/10 would be inventing
 * a precision the ingredients do not support.
 */
export function overallDifficulty(mix = {}) {
  const easy = mix.Easy || 0;
  const medium = mix.Medium || 0;
  const hard = mix.Hard || 0;
  const count = easy + medium + hard;
  if (!count) return "—";
  if (hard && (easy || medium)) return "Mixed";
  if (hard) return "Hard";
  if (medium && easy) return "Medium";
  if (medium) return "Medium";
  return "Easy";
}

/*
 * What somebody is doing, as their own page reports it.
 *
 * Presence, never evidence: it is what their browser says, it is not stored,
 * and nothing is scored from it. The ticks on the scoreboard come from the
 * judge instead. Kept separate in the wording too — "Coding" describes a
 * person, "Solved" describes a submission.
 */
export const ACTIVITY = {
  coding: { label: "Coding", dot: "bg-emerald-500" },
  testing: { label: "Testing", dot: "bg-amber-500" },
  submitting: { label: "Submitting", dot: "bg-sky-500" },
  reading: { label: "Reading", dot: "bg-brand-400" },
  away: { label: "Away", dot: "bg-brand-300" },
};

export function activityOf(state) {
  return ACTIVITY[state] || ACTIVITY.away;
}
