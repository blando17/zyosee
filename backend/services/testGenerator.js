/*
 * Turns a problem's input shape into test cases.
 *
 * What this can and cannot do is worth being blunt about, because it decides
 * how the Add Problem form is laid out.
 *
 * It CAN build inputs. Given "n is an int in [2, 200000]" and "a is n ints in
 * [-1e9, 1e9]" it will produce well-formed inputs of climbing size, the same
 * ladder the two hand-written problems use: small cases first, then sizes that
 * separate a good algorithm from a bad one.
 *
 * It CANNOT invent expected outputs. Nothing about a constraint says what the
 * right answer is. So every generated input is run through a reference solution
 * the author supplies, and whatever that prints becomes the expected output.
 * The reference solution is the definition of correct; the generator only
 * decides what it gets asked.
 *
 * The consequence is that generated tests are always self-consistent but only
 * as interesting as the spec. A problem promising "exactly one pair sums to the
 * target" cannot have that promise expressed as a range, so a purely random
 * draw would usually contain no such pair. That is what the manual cases in the
 * form are for, and why the field list below includes `sumOfK`: deriving a
 * target from the array it must be found in is the one problem-specific pattern
 * common enough to build in.
 *
 * Everything is seeded. The same spec and seed produce byte-identical inputs on
 * any machine, so a problem's tests can be rebuilt rather than backed up.
 */

// Same generator the hand-written script uses, so seeds behave identically.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function intBetween(rand, min, max) {
  return min + Math.floor(rand() * (max - min + 1));
}

/*
 * Where case `index` of `total` sits between the smallest and largest size.
 *
 * Geometric rather than linear. Linear spacing over [2, 200000] makes every
 * case except the first enormous, which is slow to generate and tests nothing
 * the largest case does not. Geometric spacing gives a handful of quick small
 * cases and then climbs, which is the shape that makes a quadratic solution
 * pass test 3 and fail test 8.
 */
function rampedSize(min, max, index, total) {
  if (total <= 1 || max <= min) return max;
  const t = index / (total - 1);
  const value = Math.round(min * Math.pow(max / min || 1, t));
  return Math.max(min, Math.min(max, value));
}

const FIELD_TYPES = ["int", "intArray", "sumOfK", "intMatrix", "string", "stringArray"];

/*
 * Checks a spec before anything is generated.
 *
 * Worth doing up front and in one place: generation runs a compiler and can
 * take a minute, and failing at case 7 because an array referenced a field name
 * that does not exist wastes all of it.
 */
function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== "object") return ["Generator spec is missing."];

  const fields = Array.isArray(spec.fields) ? spec.fields : [];
  if (!fields.length) errors.push("Add at least one input field.");

  const seen = new Set();
  fields.forEach((field, position) => {
    const where = field.name ? `Field "${field.name}"` : `Field ${position + 1}`;

    if (!field.name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.name)) {
      errors.push(`${where}: name must be a plain identifier, like n or a.`);
    } else if (seen.has(field.name)) {
      errors.push(`${where}: duplicate field name.`);
    } else {
      seen.add(field.name);
    }

    if (!FIELD_TYPES.includes(field.type)) {
      errors.push(`${where}: type must be one of ${FIELD_TYPES.join(", ")}.`);
      return;
    }

    if (field.type === "int" || field.type === "intArray" || field.type === "intMatrix") {
      // A bound naming an earlier int field is resolved when the case is built,
      // so only the reference itself can be checked here.
      let referenced = false;
      for (const key of ["min", "max"]) {
        if (typeof field[key] !== "string") continue;
        referenced = true;
        const source = fields.slice(0, position).find((f) => f.name === field[key]);
        if (!source) errors.push(`${where}: ${key} "${field[key]}" is not an earlier field.`);
        else if (source.type !== "int") errors.push(`${where}: ${key} "${field[key]}" is not an int.`);
      }
      const min = Number(field.min);
      const max = Number(field.max);
      if (referenced) {
        // Nothing numeric to check; the bound is resolved per case.
      } else if (!Number.isFinite(min) || !Number.isFinite(max)) {
        errors.push(`${where}: min and max must be numbers.`);
      } else if (min > max) {
        errors.push(`${where}: min is greater than max.`);
      } else if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
        errors.push(`${where}: min and max must be whole numbers within 2^53.`);
      }
    }

    if (field.type === "intArray") {
      // A length is either a fixed number or the name of an earlier int field.
      // Earlier, not any, because the value has to exist when the array is built.
      const lengthNames = Array.isArray(field.length)
        ? field.length
        : typeof field.length === "string"
          ? [field.length]
          : null;

      if (lengthNames) {
        for (const name of lengthNames) {
          const source = fields.slice(0, position).find((f) => f.name === name);
          if (!source) errors.push(`${where}: length "${name}" is not an earlier field.`);
          else if (source.type !== "int") errors.push(`${where}: length "${name}" is not an int.`);
        }
      } else if (!Number.isSafeInteger(Number(field.length)) || Number(field.length) < 0) {
        errors.push(`${where}: length must be a positive number, an earlier int field, or a list of them.`);
      }
    }

    if (field.type === "string" || field.type === "stringArray") {
      if (typeof field.alphabet !== "string" || field.alphabet.length === 0) {
        errors.push(`${where}: alphabet must be a non-empty string of the characters to draw from.`);
      }
      const len = field.length;
      if (typeof len === "string") {
        const source = fields.slice(0, position).find((f) => f.name === len);
        if (!source) errors.push(`${where}: length "${len}" is not an earlier field.`);
        else if (source.type !== "int") errors.push(`${where}: length "${len}" is not an int.`);
      } else if (!Number.isSafeInteger(Number(len)) || Number(len) < 0) {
        errors.push(`${where}: length must be a positive number or an earlier int field.`);
      }
      if (field.type === "stringArray") {
        const count = field.count;
        if (typeof count === "string") {
          const source = fields.slice(0, position).find((f) => f.name === count);
          if (!source) errors.push(`${where}: count "${count}" is not an earlier field.`);
          else if (source.type !== "int") errors.push(`${where}: count "${count}" is not an int.`);
        } else if (!Number.isSafeInteger(Number(count)) || Number(count) < 1) {
          errors.push(`${where}: count must be a positive number or an earlier int field.`);
        }
      }
    }

    if (field.type === "intMatrix") {
      for (const dim of ["rows", "cols"]) {
        const value = field[dim];
        if (typeof value === "string") {
          const source = fields.slice(0, position).find((f) => f.name === value);
          if (!source) errors.push(`${where}: ${dim} "${value}" is not an earlier field.`);
          else if (source.type !== "int") errors.push(`${where}: ${dim} "${value}" is not an int.`);
        } else if (!Number.isSafeInteger(Number(value)) || Number(value) < 0) {
          errors.push(`${where}: ${dim} must be a positive number or an earlier int field.`);
        }
      }
    }

    if (field.type === "sumOfK") {
      const source = fields.slice(0, position).find((f) => f.name === field.from);
      if (!source) errors.push(`${where}: "from" must name an earlier array field.`);
      else if (source.type !== "intArray") errors.push(`${where}: "from" must be an intArray.`);
      const k = Number(field.k);
      if (!Number.isInteger(k) || k < 1 || k > 5) errors.push(`${where}: k must be between 1 and 5.`);
    }
  });

  const cases = Number(spec.cases);
  if (!Number.isInteger(cases) || cases < 1 || cases > 50) {
    errors.push("Number of generated cases must be between 1 and 50.");
  }
  if (!Number.isSafeInteger(Number(spec.seed))) {
    errors.push("Seed must be a whole number.");
  }
  return errors;
}

/*
 * Builds one case's input text.
 *
 * `position` and `total` only affect how big the case is: a field marked
 * `scales` grows from its min toward its max across the run, everything else is
 * drawn from its full range every time.
 */
function buildCase(spec, rand, position, total) {
  const values = new Map();
  const lines = [];

  for (const field of spec.fields) {
    if (field.type === "int") {
      /*
       * min and max may NAME an earlier field instead of being numbers.
       *
       * Some parameters are only valid relative to another: "remove the k-th
       * node from the end" needs 1 <= k <= n, and a fixed number cannot say
       * that when n itself varies across cases. Without this the only safe
       * choice is to pin such a parameter to a constant, which means every
       * generated case tests the same value of it.
       */
      const bound = (v, offset) =>
        (typeof v === "string" ? Number(values.get(v)) : Number(v)) + (Number(offset) || 0);
      // minOffset / maxOffset shift a referenced bound, which is how a strict
      // inequality is written: "pos < n" is max "n" with an offset of -1.
      const lo = bound(field.min, field.minOffset);
      const hi = bound(field.max, field.maxOffset);
      let value = field.scales
        ? rampedSize(lo, hi, position, total)
        : intBetween(rand, lo, hi);
      /*
       * `step` restricts the value to lo, lo+step, lo+2*step and so on.
       *
       * It exists for problems whose input size must have a particular parity:
       * "every value appears twice except one" needs an odd count, and without
       * this the generator would produce even sizes that are not valid inputs
       * at all.
       */
      if (field.step && Number(field.step) > 1) {
        const step = Number(field.step);
        value = lo + Math.floor((value - lo) / step) * step;
        if (value > hi) value -= step;
      }
      values.set(field.name, value);
      /*
       * `silent` means: use this number, but do not write it into the input.
       *
       * It exists for problems whose input is just a string. The length still
       * has to be a field, because that is how it scales across cases and how
       * the string field learns how long to be — but the problem statement says
       * the input is one line, so printing the length too would produce input
       * that does not match the format the solver was given.
       *
       * Without this the expected output is generated by a reference solution
       * reading the length line AS the string, and every genuinely correct
       * submission is marked wrong.
       */
      if (!field.silent) lines.push(String(value));
      continue;
    }

    if (field.type === "intArray") {
      /*
       * `length` may be a number, the name of an earlier field, or a LIST of
       * names meaning their product. The list form is for grid problems whose
       * values are read as r rows of c, where the array really is r * c long
       * and neither dimension alone describes it.
       */
      const length = Array.isArray(field.length)
        ? field.length.reduce((acc, name) => acc * Number(values.get(name)), 1)
        : typeof field.length === "string"
          ? values.get(field.length)
          : Number(field.length);
      // Bounds may name an earlier field, the same as an int field's do.
      // "n distinct values in [0, n]" is how a missing-number input is stated.
      const min = typeof field.min === "string" ? Number(values.get(field.min)) : Number(field.min);
      const max = typeof field.max === "string" ? Number(values.get(field.max)) : Number(field.max);

      let array;
      if (field.distinct) {
        /*
         * Rejection sampling with a Set, which is fine while the range is far
         * wider than the array. When it is not, there may not be enough
         * distinct values to draw, so fall back to a shuffled run of
         * consecutive numbers rather than looping forever.
         */
        const span = max - min + 1;
        if (span < length) {
          throw new Error(
            `Field "${field.name}" asks for ${length} distinct values from a range holding ${span}.`
          );
        }
        if (span < length * 4) {
          array = Array.from({ length: span }, (_, i) => min + i);
          for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(rand() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
          }
          array = array.slice(0, length);
        } else {
          const picked = new Set();
          while (picked.size < length) picked.add(intBetween(rand, min, max));
          array = [...picked];
        }
      } else {
        array = Array.from({ length }, () => intBetween(rand, min, max));
      }

      if (field.sorted) array.sort((x, y) => x - y);

      /*
       * `rotate` turns a sorted array into a rotated sorted array.
       *
       * Without it, every generated case for a "search in a rotated array"
       * problem is rotated by zero — that is, plainly sorted — and the rotation
       * the problem is entirely about is never tested. A plain sorted array is
       * a valid rotation, which is exactly why the gap is invisible.
       */
      if (field.rotate && array.length > 1) {
        const by = Math.floor(rand() * array.length);
        array = array.slice(by).concat(array.slice(0, by));
      }

      /*
       * `mountain` rearranges distinct values into a strictly increasing run
       * followed by a strictly decreasing one, with a single peak.
       *
       * A peak-finding problem has no unique answer when several peaks exist,
       * and a judge comparing exact output needs one. Restricting the shape
       * gives exactly one peak, and keeps binary search the intended solution.
       */
      /*
       * `pairsPlusOne` makes every value appear exactly twice except one.
       *
       * A random array has many values appearing once, so a problem asking for
       * "the one that appears once" would have no well-defined answer. The
       * length must be odd, which is what `step: 2` on the size field is for.
       */
      if (field.pairsPlusOne && array.length >= 1) {
        const pairCount = Math.floor((array.length - 1) / 2);
        const distinct = [...new Set(array)];
        while (distinct.length < pairCount + 1) {
          // Widen rather than repeat: a duplicate here would break the promise.
          distinct.push((distinct.length ? Math.max(...distinct) : min) + distinct.length + 1);
        }
        const built = [];
        for (let i = 0; i < pairCount; i += 1) built.push(distinct[i], distinct[i]);
        built.push(distinct[pairCount]);
        for (let i = built.length - 1; i > 0; i -= 1) {
          const j = Math.floor(rand() * (i + 1));
          [built[i], built[j]] = [built[j], built[i]];
        }
        array = built;
      }

      if (field.mountain && array.length >= 3) {
        const sorted = [...array].sort((x, y) => x - y);
        const peakAt = 1 + Math.floor(rand() * (sorted.length - 2));
        const left = sorted.slice(0, peakAt);
        const right = sorted.slice(peakAt, sorted.length - 1).reverse();
        array = [...left, sorted[sorted.length - 1], ...right];
      }

      values.set(field.name, array);
      lines.push(array.join(" "));
      continue;
    }

    if (field.type === "string" || field.type === "stringArray") {
      /*
       * Text, drawn from an explicit alphabet.
       *
       * The alphabet is given as a literal string of allowed characters rather
       * than a named class, because the useful sets differ per problem and are
       * rarely a tidy category: "abc" for a small-alphabet palindrome problem,
       * "()[]{}" for bracket matching, "a-z plus space and comma" for a
       * tokenising one. Spelling it out is both simpler to validate and easier
       * to read back off a problem's spec.
       *
       * Note what this cannot do: it draws each character independently, so it
       * will not produce the structured inputs some problems care about — a
       * balanced bracket string, or a group of words that are anagrams of each
       * other. Those belong in curated cases, and the problems that need them
       * say so.
       */
      const alphabet = field.alphabet;
      const pick = () => alphabet[Math.floor(rand() * alphabet.length)];
      const lengthOf = () =>
        typeof field.length === "string" ? values.get(field.length) : Number(field.length);

      if (field.type === "string") {
        const text = Array.from({ length: lengthOf() }, pick).join("");
        values.set(field.name, text);
        lines.push(text);
      } else {
        const count = typeof field.count === "string" ? values.get(field.count) : Number(field.count);
        const all = [];
        for (let i = 0; i < count; i += 1) {
          // Each word gets its own length up to the cap, so a run of words is
          // not suspiciously uniform.
          const len = Math.max(1, 1 + Math.floor(rand() * lengthOf()));
          const word = Array.from({ length: len }, pick).join("");
          all.push(word);
          lines.push(word);
        }
        values.set(field.name, all);
      }
      continue;
    }

    if (field.type === "intMatrix") {
      /*
       * A grid, written one row per line.
       *
       * Two dimensions rather than an intArray of rows*cols, because a grid
       * problem's input is laid out as lines and a solver reads it that way.
       * `rowSorted` exists for interval problems, where each row is a pair that
       * must read low then high: sorting a two-column row is exactly that.
       */
      const rows = typeof field.rows === "string" ? values.get(field.rows) : Number(field.rows);
      const cols = typeof field.cols === "string" ? values.get(field.cols) : Number(field.cols);
      /*
       * Bounds may name an earlier int field, the same as an int or intArray
       * field's do. validateSpec has always allowed it for a matrix; this is
       * where it is honoured. Without it "max: n" reached Number("n") and every
       * cell came out NaN, which is a spec the validator accepts and the
       * generator cannot build.
       *
       * It is what a graph's edge list needs: the endpoints are two columns
       * bounded by the vertex count, and the vertex count varies per case.
       */
      const lo = typeof field.min === "string" ? Number(values.get(field.min)) : Number(field.min);
      const hi = typeof field.max === "string" ? Number(values.get(field.max)) : Number(field.max);

      const grid = [];
      for (let r = 0; r < rows; r += 1) {
        const row = Array.from({ length: cols }, () => intBetween(rand, lo, hi));
        if (field.rowSorted) row.sort((x, y) => x - y);
        grid.push(row);
        lines.push(row.join(" "));
      }
      values.set(field.name, grid);
      continue;
    }

    if (field.type === "sumOfK") {
      const source = values.get(field.from) || [];
      const k = Number(field.k);
      if (source.length < k) {
        throw new Error(`Field "${field.name}" needs ${k} values from "${field.from}", which has ${source.length}.`);
      }
      // Distinct positions, so "sum of two elements" never means one element
      // counted twice, which is the usual reading and the usual bug.
      const chosen = new Set();
      while (chosen.size < k) chosen.add(Math.floor(rand() * source.length));
      let sum = 0;
      for (const i of chosen) sum += source[i];
      values.set(field.name, sum);
      lines.push(String(sum));
    }
  }

  return lines.join("\n") + "\n";
}

/*
 * Every input for a spec, smallest first.
 *
 * Inputs only. Expected outputs come from running the reference solution, which
 * needs the compiler and therefore lives in the service rather than here. This
 * function is pure and synchronous, which makes it trivial to test.
 */
function generateInputs(spec) {
  const errors = validateSpec(spec);
  if (errors.length) {
    const err = new Error(errors[0]);
    err.errors = errors;
    throw err;
  }

  const rand = mulberry32(Number(spec.seed));
  const total = Number(spec.cases);
  const inputs = [];
  for (let i = 0; i < total; i += 1) {
    inputs.push(buildCase(spec, rand, i, total));
  }
  return inputs;
}

/*
 * A starting spec guessed from the constraint lines the author already typed.
 *
 * Only a convenience: it pre-fills the form, and the author corrects it. It is
 * deliberately conservative, because a wrong guess the author does not notice
 * is worse than no guess at all. It reads lines shaped like "1 <= n <= 200000"
 * and nothing cleverer.
 */
function specFromConstraints(constraints = []) {
  const fields = [];

  for (const line of constraints) {
    if (typeof line !== "string") continue;
    const text = line.replace(/\s+/g, " ").trim();

    // 1 <= n <= 200000   /   -10^9 <= a[i] <= 10^9
    const match = text.match(
      /^(-?[\d^e]+)\s*<=?\s*([A-Za-z_][A-Za-z0-9_]*)(\[[^\]]*\])?\s*<=?\s*(-?[\d^e]+)$/
    );
    if (!match) continue;

    const toNumber = (raw) => {
      const power = raw.match(/^(-?)(\d+)\^(\d+)$/);
      if (power) {
        const value = Math.pow(Number(power[2]), Number(power[3]));
        return power[1] === "-" ? -value : value;
      }
      const plain = Number(raw);
      return Number.isFinite(plain) ? plain : null;
    };

    const min = toNumber(match[1]);
    const max = toNumber(match[4]);
    if (min === null || max === null || min > max) continue;

    const name = match[2];
    const indexed = Boolean(match[3]);

    if (indexed) {
      // "a[i] <= 10^9" describes the elements of an array, not a scalar. Its
      // length is whatever earlier scalar looks like a size, which is the
      // convention every statement here already follows.
      const size = fields.find((f) => f.type === "int" && f.scales);
      fields.push({
        name,
        type: "intArray",
        length: size ? size.name : 10,
        min,
        max,
        distinct: false,
        sorted: false,
      });
    } else {
      // The first plain scalar with a wide range is almost always the size.
      const looksLikeSize = min >= 0 && max >= 100 && !fields.some((f) => f.scales);
      fields.push({ name, type: "int", min, max, scales: looksLikeSize });
    }
  }

  return {
    seed: 20260922,
    cases: 8,
    fields,
  };
}

module.exports = {
  generateInputs,
  validateSpec,
  specFromConstraints,
  mulberry32,
  rampedSize,
  FIELD_TYPES,
};
