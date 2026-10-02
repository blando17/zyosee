import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import HeroArt from "../components/HeroArt";
import {
  ArenaLive,
  CompilerLive,
  FriendsLive,
  PairLabLive,
  ProblemsLive,
  ProgressLive,
} from "../components/LiveArt";
import Reveal from "../components/Reveal";
import BandDecor from "../components/BandDecor";
import PlatformStats from "../components/PlatformStats";
import arenaBackdrop from "../assets/arena-backdrop.webp";
import pairLabBackdrop from "../assets/pairlab-backdrop.webp";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

/*
 * The landing page, and where signing in now leaves you.
 *
 * HOW IT IS ORDERED
 *
 * Every feature gets a band of its own, met one at a time as you scroll, with
 * the picture alternating side to side.
 *
 * Two earlier attempts were worse. A grid of six equal cards read as wallpaper
 * — tiles of the same size say "here is a list of features" and get skimmed.
 * Pairing the first two into one row was better but still put them in
 * competition with each other for the same glance, and gave each of them half
 * the room the rest had. A band each says "here is a thing you can do", and
 * every feature gets the same space for a real sentence and a picture of
 * itself working.
 *
 * THE NUMBERS, AND WHY THEY CAME BACK
 *
 * There used to be a band under the headline counting problems, test cases and
 * languages, and it was removed for being a specification sheet: three large
 * numbers answering a question nobody arrives with.
 *
 * PlatformStats is not that band. The old one described the software; this one
 * describes the people using it, which is the question somebody does arrive
 * with — whether the place is worth their evening. It also sits below the
 * headline rather than inside it, so the first thing read is still a sentence.
 *
 * It is the only part of this page that talks to a server, and it is built to
 * disappear rather than block: if the request fails the band renders nothing
 * and the rest of the page is exactly what it was.
 */

const REQUIRES_ACCOUNT = "Needs an account";

/*
 * The bands, in the order somebody meets them.
 *
 * `flip` alternates which side the picture sits on. `points` exists because a
 * band is wide enough to leave a paragraph looking lonely, and three concrete
 * facts are more use than three more lines of prose.
 */
const BANDS = [
  {
    to: "/problems",
    icon: "problems",
    eyebrow: "The problem set",
    title: "Problems",
    blurb:
      // Deliberately no count. This said "hundreds" while the set was 473 and
      // was still saying it at 73, which is the failure mode of writing a
      // number into prose: nobody remembers the sentence exists when the number
      // moves. The live figure is three inches up the page in the statistics
      // band, read from the database on every load, so this says what the
      // problems ARE and lets that say how many.
      "Curated problems across the usual data structures and algorithms. Submit, and the judge runs your code against every hidden test and answers with a verdict.",
    points: [
      "Easy through Hard, with the topics on every problem",
      "Every submission runs against every test, not a sample",
      "C, C++, Python and Java",
    ],
    cta: "Browse problems",
    art: <ProblemsLive />,
    guarded: false,
    flip: false,
  },
  {
    to: "/pair",
    icon: "pair",
    eyebrow: "Two people, one file",
    title: "Pair Lab",
    blurb:
      "Open one file with a friend and solve a problem together. Both of you type in it, and every keystroke shows up on the other screen.",
    points: [
      "Cursors tinted by person, so you never edit over each other",
      "A chat panel beside the editor for talking the approach through",
      "Run and submit without leaving the room",
    ],
    cta: "Start a session",
    art: <PairLabLive />,
    guarded: true,
    flip: true,
    scene: pairLabBackdrop,
  },
  {
    to: "/arena",
    icon: "duel",
    eyebrow: "Head to head",
    title: "Duel Arena",
    blurb:
      "Challenge a friend to a timed match. Same problems, same clock, hidden from both of you until the countdown ends.",
    points: [
      "Random match, or pick the problems yourself",
      "Scored on correctness, speed and how few submissions it took",
      "Ratings move after every finished duel",
    ],
    cta: "Enter the arena",
    art: <ArenaLive />,
    guarded: true,
    flip: false,
    /*
     * The one band with a photograph behind it.
     *
     * A rendered arena is not something the drawn ornaments could have
     * produced, and the duel is the one feature where a sense of occasion is
     * part of what it is. It replaces BandDecor rather than sitting under it:
     * blobs and dot matrices over a lit scene would be two decorations
     * fighting.
     */
    scene: arenaBackdrop,
  },
  {
    to: "/progress",
    icon: "progress",
    eyebrow: "Your record",
    title: "Progress",
    blurb:
      "Everything here is worked out from submissions the judge actually ran — no self-reporting, and nothing called mastery.",
    points: [
      "Streaks, acceptance rate and attempts per solve",
      "Which topics are going stale and want another go",
      "Your arena rating, duel by duel",
    ],
    cta: "See your progress",
    art: <ProgressLive />,
    guarded: true,
    flip: true,
  },
  {
    to: "/compiler",
    icon: "compiler",
    eyebrow: "Scratch pad",
    title: "Online compiler",
    blurb:
      "Write and run code in four languages against your own input, with no problem attached and nothing to submit.",
    points: [
      "C, C++, Python and Java",
      "Your own input, and the output side by side",
      "Nothing is stored — it is compiled, run, and deleted",
    ],
    cta: "Open the compiler",
    art: <CompilerLive />,
    guarded: true,
    flip: false,
  },
  {
    to: "/friends",
    icon: "friends",
    eyebrow: "The people you study with",
    title: "Friends",
    blurb:
      "Add the people you actually work with. Pairing and duelling both start from this list, and neither is open to strangers.",
    points: [
      "Search by username — never by email",
      "See what they have solved",
      "Invite them into a room or a duel in one click",
    ],
    cta: "Find your people",
    art: <FriendsLive />,
    guarded: true,
    flip: true,
  },
];

function GuardNote() {
  return (
    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">
      {REQUIRES_ACCOUNT}
    </span>
  );
}

/*
 * A photographic backdrop for one band.
 *
 * MAKING A PICTURE BEHAVE LIKE A BACKGROUND
 *
 * Three washes sit over it, and each one is doing a job rather than an effect:
 *
 *   vertical    fades to the page colour at the top and bottom, so the band
 *               joins the ones either side instead of being a rectangle
 *               dropped on the page — the same seam problem the flat white
 *               pane had, and the same fix.
 *   horizontal  fades to the page colour on the reading side. The words have
 *               to stay legible over whatever part of the image lands behind
 *               them at a given window width, and that cannot be arranged by
 *               choosing a crop.
 *   warm tint   a low-opacity brand wash, because the scene is cooler and
 *               purpler than the rest of the site and would otherwise read as
 *               something pasted in from elsewhere.
 *
 * The image is decorative: empty alt, aria-hidden, and it carries no meaning
 * the words beside it do not already carry. It is also lazy-loaded — it is a
 * long way down a long page, and nobody should wait for it to see the top.
 */
function BandScene({ src, flip = false }) {
  /*
   * Which way the horizontal fade runs depends on where the words are.
   *
   * A flipped band puts the picture on the left and the words on the right, so
   * a fade that always ran left to right would wash out the half nobody reads
   * over and leave the text sitting on the busiest part of the image.
   *
   * WHY THIS IS AN INLINE STYLE AND NOT A TAILWIND CLASS
   *
   * Tailwind generates CSS by scanning source files for complete class
   * strings. An interpolated one — bg-[${flip ? a : b}] — is never a complete
   * string in the file, so the scanner never sees it and the rule is never
   * generated: the class lands in the HTML and does nothing at all. A gradient
   * that genuinely depends on a prop belongs in a style attribute, where it is
   * computed at render time by the browser rather than at build time by a
   * scanner.
   */
  /*
   * The fade runs toward whichever side the words are on. A flipped band puts
   * the picture on the left and the words on the right, so a fade that always
   * ran the same way would wash out the half nobody reads over.
   */
  /*
   * Deliberately thinner than it first was.
   *
   * The original stops were #fffbeb solid at the reading edge falling to 0.88
   * — which kept the words crisp and erased whoever was standing behind them.
   * For the pairing scene that meant one of the two people vanished, and she
   * is half the reason the picture is there.
   *
   * These stops let her through, and the text still reads. That was measured
   * rather than assumed: the image was composited with this gradient and
   * sampled at 576 points across the paragraph's own box, giving a worst-case
   * contrast of 7.5:1 against the body colour — comfortably past the 4.5:1
   * that small text needs, and past the 7:1 of the stricter AAA level too.
   *
   * Worth re-measuring if these numbers are lowered further or a darker
   * picture is dropped behind a band.
   */
  /*
   * The page colour, read from the variable rather than written in.
   *
   * These stops used to be the literal #fffbeb, which is the LIGHT page
   * colour. The moment a dark theme existed those two bands went on fading to
   * cream while the rest of the page went dark — leaving light body text on a
   * bright background, which is the one combination that is unreadable in both
   * themes at once. A hardcoded colour in a themed app is a bug waiting for a
   * theme.
   */
  const page = "rgb(var(--brand-50))";
  const across = `linear-gradient(to ${flip ? "left" : "right"},
    ${page} 0%,
    rgb(var(--brand-50) / 0.6) 30%,
    rgb(var(--brand-50) / 0.52) 55%,
    transparent 76%)`;
  const down = `linear-gradient(to bottom,
    rgb(var(--brand-50) / 0.94) 0%,
    rgb(var(--brand-50) / 0.9) 46%,
    rgb(var(--brand-50) / 0.45) 72%,
    rgb(var(--brand-50) / 0.2) 100%)`;

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/*
        width/height are the file's real dimensions, so the browser reserves
        the right box before the bytes arrive instead of reflowing the band
        when they do.
        fetchPriority low because this is decoration a long way down the page
        and must never compete with the fonts or the first screen.
      */}
      <img
        src={src}
        alt=""
        width={2000}
        height={667}
        loading="lazy"
        decoding="async"
        /* Lowercase deliberately. The camelCase spelling warned in the
           console on this project's react-dom — "React does not recognize the
           fetchPriority prop on a DOM element" — and was dropped rather than
           applied. Lowercase passes straight through to the DOM and is what
           the HTML attribute is actually called. */
        fetchpriority="low"
        className="h-full w-full object-cover object-center"
      />

      {/* The seam fade, both ends, at every width. */}
      <span
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgb(var(--brand-50)) 0%, transparent 20%, transparent 80%, rgb(var(--brand-50)) 100%)",
        }}
      />

      {/*
        The readability wash runs along whichever axis the text is on.
        Wide, the band is two columns, so it fades across. Narrow, the band
        STACKS — words above, picture below — and a sideways fade then does
        nothing useful: it left a banner running straight through the middle of
        a paragraph. The narrow one runs top to bottom, heavy over the text and
        clearing by the time it reaches the art.
      */}
      <span className="absolute inset-0 lg:hidden" style={{ backgroundImage: down }} />
      <span className="absolute inset-0 hidden lg:block" style={{ backgroundImage: across }} />

      {/* A brand wash, because these scenes are cooler than the rest of the
          site and would otherwise read as pasted in from somewhere else. */}
      <span className="absolute inset-0 bg-brand-200/10 mix-blend-multiply" />

      {/*
        A residual veil, so the scene never reaches full strength anywhere.
        These files are 2000px wide. A band 1440 CSS pixels across on a
        retina screen needs 2880 device pixels, so the image is stretched
        about 1.44x past what it has — and no amount of CSS puts back detail
        that is not in the file.
        What CAN be done is stop the eye trying to resolve it. Held a little
        behind the page, the softness reads as depth rather than as a picture
        that failed to load properly. A sharper result needs a larger export,
        not a different rule here.
      */}
      <span className="absolute inset-0 bg-brand-50/12" />
    </div>
  );
}

/*
 * One full-width band.
 *
 * The picture and the words are two columns that swap sides, and on a narrow
 * screen the order is forced back to words-then-picture whichever way round it
 * was — reading a caption before the thing it describes is worse than losing
 * the zig-zag.
 */
function FeatureBand({ band, guardShown, index, isDark }) {
  const { to, icon, eyebrow, title, blurb, points, cta, art, guarded, flip, scene } = band;

  /*
   * Alternate bands are lifted with a pale wash.
   *
   * The first attempt at this was a flat `bg-surface/55` with a border on top,
   * and it produced exactly the fault it was meant to cure: a hard horizontal
   * seam where the tinted page stopped and a block of near-white began, cutting
   * the page in half. A solid colour against a soft gradient always shows its
   * edge.
   *
   * So the wash is a vertical gradient that starts and ends at nothing. There
   * is no line to see, because at the top and bottom of the band the overlay
   * is fully transparent and the page underneath is simply itself.
   */
  const lifted = index % 2 === 1;
  const tint = ["brand", "warm", "cool"][index % 3];

  return (
    /*
     * Every band is the same height, and that is load-bearing rather than
     * tidiness.
     *
     * object-cover scales an image to fill the HEIGHT of its box, so a taller
     * band magnifies the same file and crops more off the sides. A band that
     * grew — by stacking its content, or by taking extra padding — made its
     * own background look zoomed in next to its neighbours. Matching heights
     * is what keeps the scenes at a matching scale.
     */
    <section className="relative overflow-hidden py-14 sm:py-20">
      {lifted && (
        <span
          className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b
                     from-transparent via-surface/65 to-transparent"
          aria-hidden="true"
        />
      )}

      {/*
        The photographs are for the light theme only.
        Both are bright, warm illustrations — cream walls, sunlight, pale
        skin tones. There is no wash that makes a picture that light sit on a
        near-black page without either washing it away entirely or leaving a
        glowing panel in the middle of a dark document. In dark mode these two
        bands therefore get exactly the background their neighbours get.
      */}
      {scene && !isDark ? (
        <BandScene src={scene} flip={flip} />
      ) : (
        <BandDecor flip={flip} variant={index} tint={tint} />
      )}

      <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 lg:grid-cols-2 lg:gap-14">
        <Reveal className={flip ? "lg:order-2" : ""}>
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">
            {eyebrow}
          </p>
          <h2 className="mt-1.5 flex flex-wrap items-center gap-2.5 font-display text-3xl font-extrabold text-ink-900">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Icon name={icon} className="h-[22px] w-[22px]" />
            </span>
            {title}
            {guarded && guardShown && <GuardNote />}
          </h2>

          <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-800">{blurb}</p>

          <ul className="mt-4 space-y-2">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5 text-sm text-ink-800">
                <span className="mt-[3px] shrink-0 text-brand-500" aria-hidden="true">
                  ✦
                </span>
                {point}
              </li>
            ))}
          </ul>

          <Link to={to} className="btn-primary mt-6">
            {cta} <span aria-hidden="true">→</span>
          </Link>
        </Reveal>

        {/* The picture arrives a beat after the words, so the eye is already
            where it needs to be when the thing starts moving. */}
        <Reveal delay={140} className={flip ? "lg:order-1" : ""}>
          <div className="rounded-2xl border border-white/70 bg-surface/80 p-4 shadow-lg shadow-brand-900/5
                          ring-1 ring-brand-900/5 backdrop-blur-sm">
            {art}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const { isLoggedIn, user } = useAuth();
  const { isDark } = useTheme();
  const guardShown = !isLoggedIn;

  return (
    <main>

      {/* -------------------------------- hero -------------------------------- */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl">
            MASTER YOUR <span className="text-brand-600">CODE</span>
          </h1>
          <p className="mt-3 text-xl font-bold text-ink-900 sm:text-2xl">
            Practice. Compile. Compete. Improve.
          </p>
          <p className="mt-4 max-w-xl text-lg text-ink-800">
            {isLoggedIn
              ? `Welcome back, ${user.username}. Pick a problem, pair with a friend, or challenge one to a duel.`
              : "Solve programming problems against a real judge — on your own, beside a friend, or head to head."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/problems" className="btn-primary">
              Start Solving <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link to="/pair" className="btn-ghost">
              <Icon name="pair" className="h-4 w-4" /> Pair Lab
            </Link>
            <Link to="/arena" className="btn-ghost">
              <Icon name="duel" className="h-4 w-4" /> Duel Arena
            </Link>
          </div>

          {!isLoggedIn && (
            <p className="mt-4 text-sm text-ink-500">
              Browsing problems needs no account. Running code, pairing and duelling do.
            </p>
          )}
        </div>

        <HeroArt />
      </section>

      {/* ------------------------------- the numbers -------------------------- */}
      {/*
        Between the hero and the first feature, which is where it earns its
        place: somebody has just read what the site claims to be, and the next
        question is whether anyone is actually here. Putting it below the six
        bands would answer that question after they had already decided.
      */}
      <PlatformStats />

      {/* ------------------------------ one at a time ------------------------- */}
      {BANDS.map((band, index) => (
        <FeatureBand key={band.to} band={band} guardShown={guardShown} index={index} isDark={isDark} />
      ))}

      {/* -------------------------------- sign up ----------------------------- */}
      {!isLoggedIn && (
        <section className="relative overflow-hidden px-6 py-16">
          <span
            className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b
                       from-transparent via-surface/65 to-transparent"
            aria-hidden="true"
          />
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-100 via-brand-50 to-surface px-6 py-8 text-center">
              <p className="font-display text-xl font-extrabold text-ink-900">
                Everything above is free to use.
              </p>
              <p className="mt-1.5 text-sm text-ink-800">
                An account takes a username and a password. No email is ever shown to anybody else.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/signup" className="btn-primary">
                  Create an account
                </Link>
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* --------------------------------- credit ----------------------------- */}
      <footer className="relative px-6 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-ink-500">
            Contributed by
          </p>
          <p className="mt-1.5 font-display text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
            SOUMYADEEP DE
          </p>
          <span
            className="mx-auto mt-3 block h-1 w-12 rounded bg-brand-400"
            aria-hidden="true"
          />
        </div>
      </footer>
    </main>
  );
}
