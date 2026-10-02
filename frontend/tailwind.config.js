/** @type {import('tailwindcss').Config} */
export default {
  // Themed by an attribute on <html>, set by ThemeContext.
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // One orange-to-yellow ramp used everywhere, so the whole app stays on
      // theme without anyone picking colours ad hoc.
      /*
       * Every colour is a CSS variable, and that is what makes a dark theme
       * possible at all here.
       *
       * The app has something like eight hundred colour classes across fifty
       * seven files. Adding a `dark:` variant to each of them would be a
       * enormous diff, would be wrong in a dozen places nobody noticed, and
       * would have to be repeated by whoever adds the next page. Pointing the
       * SCALE at variables instead means `bg-brand-50` is the page background
       * in both themes and `text-ink-900` is the body colour in both themes —
       * the classes never change, only what they resolve to.
       *
       * The channels are stored space separated ("255 251 235") rather than as
       * hex, because that is the form `rgb(... / <alpha-value>)` needs. Without
       * it every opacity modifier in the app — bg-white/70, brand-200/40 —
       * would silently stop working.
       *
       * Note the scale is not monotonic in dark mode. 50 to 200 are surfaces
       * and go dark; 300 upwards are accents and stay vivid, because a button
       * and a border cannot both flip the same way and still be legible.
       */
      colors: {
        brand: {
          50: "rgb(var(--brand-50) / <alpha-value>)",
          100: "rgb(var(--brand-100) / <alpha-value>)",
          200: "rgb(var(--brand-200) / <alpha-value>)",
          300: "rgb(var(--brand-300) / <alpha-value>)",
          400: "rgb(var(--brand-400) / <alpha-value>)",
          500: "rgb(var(--brand-500) / <alpha-value>)",
          600: "rgb(var(--brand-600) / <alpha-value>)",
          700: "rgb(var(--brand-700) / <alpha-value>)",
          800: "rgb(var(--brand-800) / <alpha-value>)",
          900: "rgb(var(--brand-900) / <alpha-value>)",
        },
        ink: {
          500: "rgb(var(--ink-500) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
          800: "rgb(var(--ink-800) / <alpha-value>)",
          900: "rgb(var(--ink-900) / <alpha-value>)",
        },
        /* A card, a panel, a field — anything that sits on the page. */
        surface: "rgb(var(--surface) / <alpha-value>)",
        /*
         * Deliberately dark in BOTH themes: the fake editors, the terminal
         * panels, the countdown overlay. A code window that turned white in
         * dark mode would be the one thing on the page that got brighter.
         */
        code: "rgb(var(--code) / <alpha-value>)",
        "code-soft": "rgb(var(--code-soft) / <alpha-value>)",
        /* Text that sits ON an amber button, which is amber in both themes. */
        "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
      },
      fontFamily: {
        // The interface face, applied to everything by Tailwind's own `font-sans`.
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        // Same family, used through `font-display` so headings can be tuned
        // (heavier weight, tighter tracking) without touching body text.
        display: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Fira Code"', '"Fira Mono"', "ui-monospace", "monospace"],
      },

      /*
       * The home page's live illustrations.
       *
       * Defined here rather than as inline styles so every loop is in one
       * place and can be read next to the others — and so index.css can switch
       * the whole set off in one rule when somebody has asked for reduced
       * motion. These run forever on a landing page, which is exactly the kind
       * of movement that makes some people ill, so that rule is not optional.
       *
       * Distances are in pixels and match the elements they move through: the
       * carets step 18px because the fake code lines are 18px apart, and a
       * change to one without the other would put a cursor between two lines.
       */
      keyframes: {
        /*
         * Two people editing the same file.
         *
         * The hold-then-snap shape matters more than the duration. Writing
         * "0%, 22%" and then "26%" means the caret SITS on a line for a fifth
         * of the loop and then crosses to the next one in four per cent of it
         * — about a tenth of a second. An evenly spread ease-in-out drifts
         * between lines instead, which reads as a floating rectangle rather
         * than as somebody moving their cursor.
         *
         * 18px per step, because the fake code lines are 18px apart. Change
         * one without the other and the cursor lands between two lines.
         */
        "caret-a": {
          "0%, 22%": { transform: "translateY(18px)" },
          "26%, 48%": { transform: "translateY(0)" },
          "52%, 74%": { transform: "translateY(54px)" },
          "78%, 100%": { transform: "translateY(18px)" },
        },
        "caret-b": {
          "0%, 20%": { transform: "translateY(36px)" },
          "24%, 46%": { transform: "translateY(54px)" },
          "50%, 72%": { transform: "translateY(18px)" },
          "76%, 100%": { transform: "translateY(36px)" },
        },

        /*
         * A line being written.
         *
         * Paired with steps() in the animation below, so the bar grows in
         * discrete jumps like characters appearing rather than sliding out
         * smoothly. A smooth width transition is the single thing that makes a
         * fake editor look like a progress bar.
         */
        type: {
          "0%": { width: "8%" },
          "62%, 100%": { width: "74%" },
        },
        "type-late": {
          "0%, 14%": { width: "8%" },
          "70%, 100%": { width: "58%" },
        },
        // The cursor at the end of whatever is being typed.
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },

        /*
         * Two duel scores climbing.
         *
         * Only ever upward, then a hold, then back to the start for the next
         * match. An oscillating bar was the first attempt and said the wrong
         * thing entirely — scores in a duel do not go down.
         */
        "race-a": {
          "0%": { width: "8%" },
          "28%": { width: "34%" },
          "56%": { width: "61%" },
          "80%, 96%": { width: "82%" },
          "100%": { width: "8%" },
        },
        "race-b": {
          "0%": { width: "8%" },
          "34%": { width: "41%" },
          "62%": { width: "52%" },
          "86%, 96%": { width: "68%" },
          "100%": { width: "8%" },
        },
        // A problem going green. Phase-shifted per chip with a delay, so the
        // three of them light up in order.
        solved: {
          "0%, 24%": { backgroundColor: "rgba(255,255,255,0.10)", color: "rgba(253,230,138,0.55)" },
          "30%, 92%": { backgroundColor: "rgba(16,185,129,0.22)", color: "#6ee7b7" },
          "100%": { backgroundColor: "rgba(255,255,255,0.10)", color: "rgba(253,230,138,0.55)" },
        },
        // The clock running down across the top of the duel card.
        drain: {
          "0%": { width: "100%" },
          "92%, 100%": { width: "0%" },
        },

        /*
         * A problem being judged: the row tints and a verdict lands on it.
         * One keyframe, entered at a different point by each row via a
         * negative delay, so the three of them are judged in sequence rather
         * than all at once.
         */
        verdict: {
          "0%, 34%": { opacity: "0", transform: "scale(0.55)" },
          "44%, 88%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.55)" },
        },
        "row-solve": {
          "0%, 34%": { backgroundColor: "rgba(253,230,138,0)" },
          "44%, 88%": { backgroundColor: "rgba(16,185,129,0.12)" },
          "100%": { backgroundColor: "rgba(253,230,138,0)" },
        },

        /*
         * Bars on a progress chart growing.
         *
         * scaleY with the origin at the bottom rather than an animated height:
         * a transform is composited, a height is not, so this is the version
         * that does not relayout the chart sixty times a second.
         */
        "bar-rise": {
          "0%": { transform: "scaleY(0.08)" },
          "48%, 86%": { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(0.08)" },
        },
        // A streak number pulsing as it climbs.
        "count-pop": {
          "0%, 30%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.18)" },
          "50%, 100%": { transform: "scale(1)" },
        },

        // Program output appearing a character at a time.
        "out-type": {
          "0%, 22%": { width: "0%" },
          "62%, 100%": { width: "100%" },
        },
        // The run button being pressed.
        press: {
          "0%, 12%": { transform: "scale(1)", filter: "brightness(1)" },
          "18%": { transform: "scale(0.92)", filter: "brightness(1.25)" },
          "26%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
        },

        // A friend request crossing the gap, and being accepted.
        fly: {
          "0%, 8%": { transform: "translateX(0)", opacity: "0" },
          "16%": { transform: "translateX(6px)", opacity: "1" },
          "52%": { transform: "translateX(70px)", opacity: "1" },
          "60%, 100%": { transform: "translateX(76px)", opacity: "0" },
        },
        "pop-in": {
          "0%, 58%": { transform: "scale(0)", opacity: "0" },
          "70%, 92%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0)", opacity: "0" },
        },

        /*
         * The drifting colour behind every page.
         *
         * Slow enough to be ambient rather than animated — these take twenty
         * to thirty seconds a cycle, so nothing on screen is ever seen to
         * move, only to have changed. translate3d keeps them on the compositor
         * instead of repainting a blurred element the size of the viewport.
         */
        "drift-a": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(6%, -8%, 0) scale(1.12)" },
        },
        "drift-b": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1.08)" },
          "50%": { transform: "translate3d(-7%, 6%, 0) scale(1)" },
        },
        "drift-c": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(4%, 7%, 0) scale(1.15)" },
        },

        "float-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "ring-out": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        // A light sweeping across a card on hover.
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-12deg)" },
          "100%": { transform: "translateX(320%) skewX(-12deg)" },
        },
      },
      animation: {
        /*
         * Faster than the first attempt, which sat at six and seven seconds a
         * loop and read as sluggish: a card you glance at for two seconds has
         * to show you something in those two seconds.
         *
         * The two carets are on 4s and 5.2s deliberately. Equal durations
         * would lock them into the same rhythm for ever, and two people
         * typing in step looks choreographed rather than alive; lengths that
         * do not divide into each other keep drifting apart and back.
         */
        "caret-a": "caret-a 4s cubic-bezier(0.22,1,0.36,1) infinite",
        "caret-b": "caret-b 5.2s cubic-bezier(0.22,1,0.36,1) infinite",
        type: "type 2.6s steps(11) infinite",
        "type-late": "type-late 3.4s steps(9) infinite",
        blink: "blink 1s steps(1) infinite",
        "race-a": "race-a 4.4s cubic-bezier(0.34,1.2,0.64,1) infinite",
        "race-b": "race-b 4.4s cubic-bezier(0.34,1.2,0.64,1) infinite",
        solved: "solved 4.4s ease-in-out infinite",
        drain: "drain 4.4s linear infinite",
        verdict: "verdict 4.2s ease-out infinite",
        "row-solve": "row-solve 4.2s ease-out infinite",
        "bar-rise": "bar-rise 3.6s cubic-bezier(0.34,1.3,0.64,1) infinite",
        "count-pop": "count-pop 3.6s ease-out infinite",
        "out-type": "out-type 3.4s steps(18) infinite",
        press: "press 3.4s ease-out infinite",
        fly: "fly 3.8s ease-in-out infinite",
        "pop-in": "pop-in 3.8s cubic-bezier(0.34,1.4,0.64,1) infinite",
        "drift-a": "drift-a 24s ease-in-out infinite",
        "drift-b": "drift-b 31s ease-in-out infinite",
        "drift-c": "drift-c 27s ease-in-out infinite",
        "float-soft": "float-soft 4s ease-in-out infinite",
        "ring-out": "ring-out 1.6s ease-out infinite",
        sheen: "sheen 0.9s ease-out",
      },
    },
  },
  plugins: [],
};
