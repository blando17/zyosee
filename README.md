# Online Judge

Stage one: accounts and an online compiler. Problems, test cases, submissions
and Docker sandboxing come later.

## Layout

```
oj/
├── backend/    Accounts API      port 5001   JWT auth + user CRUD, MongoDB
├── compiler/   Compile, run, judge, AI analysis   port 8000
│   └── problems/   problem statements and test case files
├── frontend/   Vite + React      port 5173   Tailwind, orange-yellow theme
└── scripts/    test case generator
```

Two servers on purpose. A submitted program that runs away with the CPU or the
memory cannot take the login endpoints down with it.

`AlgoU-Online-Compiler-main/` is the reference project this was built from. It
is not wired into anything and can be deleted.

## Setup

Each service has a `.env.sample`. Copy it to `.env` and fill it in.

```bash
cp backend/.env.sample backend/.env
cp compiler/.env.sample compiler/.env
cp frontend/.env.sample frontend/.env
```

Two values must line up or nothing works:

- `JWT_SECRET_KEY` must be **byte-identical** in `backend/.env` and
  `compiler/.env`. The accounts API signs tokens with it; the compiler service
  verifies them with it.
- `DB_NAME` must match the database named at the end of `MONGODB_URI`.

Install and run, three terminals:

```bash
cd backend  && npm install && npm run dev
cd compiler && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173.

## Accounts API, port 5001

| Method | Route         | Auth | Purpose                        |
| ------ | ------------- | ---- | ------------------------------ |
| POST   | `/signup`     | no   | create account, returns a token |
| POST   | `/login`      | no   | returns a token                 |
| GET    | `/me`         | yes  | the caller, resolved from token |
| GET    | `/users`      | no   | list users, no password hashes  |
| GET    | `/users/:id`  | no   | one user                        |
| PUT    | `/users/:id`  | yes  | update, own account only        |
| DELETE | `/users/:id`  | yes  | delete, own account only        |

Protected routes want `Authorization: Bearer <token>`. Tokens last one hour;
change `TOKEN_TTL` in `backend/controllers/userController.js`.

### Where signing in lands you

The home page, not the compiler. It used to drop you straight into the editor,
which decided for you; now the landing page lays out what there is and you pick.
The one exception is a page you were bounced off, by the session banner or by a
protected route, which sends you back where you were headed.

The three figures on that page are read from the compiler service rather than
written into the markup, so they cannot drift out of date or overstate what is
there.

### When a token expires

The page used to keep looking signed in after the token lapsed, and you only
found out when Run or Submit failed with an error that read like a broken judge.
Three things now catch it, and whichever fires first shows the same banner:

1. **On load**, a stored token is checked for expiry before it is used. An
   expired one is dropped without asking the server.
2. **A timer** fires at the exact moment the token lapses, so a page left open
   updates itself instead of waiting for a click.
3. **Any 401 or 403**, from either service, clears the session. That is the
   backstop for a token the server rejects for a reason the page cannot see,
   such as a restarted service with a new `JWT_SECRET_KEY`.

The banner does not navigate anywhere on its own, and the editor saves a draft
per problem and language to localStorage, so signing in again costs you nothing
you had typed.

## Compiler service, port 8000

`POST /run` with a bearer token and a body of `{ language, code, input }`.
Languages are `cpp`, `c`, `py`, `java`.

It replies with a verdict:

| Verdict                 | Meaning                             |
| ----------------------- | ----------------------------------- |
| `success`               | ran and exited zero                 |
| `compilation_error`     | the toolchain refused it            |
| `runtime_error`         | non-zero exit, or killed by a signal |
| `time_limit_exceeded`   | still running after `RUN_TIMEOUT_MS` |
| `output_limit_exceeded` | printed past `MAX_OUTPUT_BYTES`      |

Source is written to `compiler/codes/<uuid>/`, compiled, run, then deleted in a
`finally` block. Nothing about a run is persisted.

### About the two timings

The reply carries `compileMs` and `runMs` separately, and the UI shows both.
They are kept apart because compiling a C++ file costs a few hundred
milliseconds whatever the program does, so one combined figure is mostly a
measurement of the compiler. A hello-world spends around 280 ms compiling and
under 10 ms running.

A quick program is also run twice and the faster time kept. macOS validates a
newly written executable the first time it runs, which costs about 600 ms, and
every submission compiles a fresh binary. Without the second run the timer
reported roughly 500 ms for a program that adds two numbers. Set `WARM_UP_RUNS=0`
in `compiler/.env` to report the first run as it comes.

## Running the compiler in Docker

The compiler service is the one piece that runs other people's code, so it is
the one piece that belongs in a container. Everything else still runs on the
host.

```bash
cd compiler
npm run docker:build    # first time, and after changing the Dockerfile
npm run docker:start    # detached, port 8000, reads .env, mounts problems/
npm run docker:logs     # follow the log
npm run docker:stop
```

Nothing else changes. The container publishes 8000 to the host, so the frontend
keeps calling `http://localhost:8000` and no frontend file was touched. Running
`npm start` on the host instead of the container still works and is the quicker
loop while editing judge code.

### Problems live outside the image

The image is the compiler and judge engine. The problems are content, and
`.dockerignore` keeps `problems/` out of the build entirely. They arrive as a
read-only mount at run time:

```
-v "$(pwd)/problems:/app/problems:ro"
```

Two reasons. Content changes far more often than the engine does, so baking it
in would mean rebuilding and re-pushing the image for every new problem. And a
published image containing `problems/` hands the hidden test cases to anyone who
pulls it, which defeats the point of having hidden tests.

Read-only matters on its own: submitted code runs in this container, and it must
never be able to rewrite the expected output it is being judged against. The
container confirms this — a `touch` inside `/app/problems` fails with
`Read-only file system`.

Adding a problem is therefore a folder and a restart, with no rebuild:

```bash
mkdir -p problems/my-problem/tests     # problem.json + 1.in/1.out ...
docker restart oj-compiler
```

The restart is required because `problems.js` reads everything once at startup
rather than per request.

Without the mount the image still starts and still serves `/run`; `loadAll()`
returns an empty set when the folder is absent, so it degrades to a plain online
compiler with zero problems rather than failing. That is the intended shape: the
image is the engine, and where the problems come from is a run-time decision —
a mounted folder today, a database later.

### What is in the image, and why Debian

`node:22-bookworm-slim`, plus `build-essential`, `python3` and
`default-jdk-headless`. A stock Node image has no compilers at all, so the
course's `FROM node:alpine` Dockerfile would fail every submission with
`g++: not found` — the toolchains are the whole point here.

Debian rather than Alpine costs about a gigabyte and buys the GNU toolchain
competitive programmers actually write against. Most visibly, `bits/stdc++.h`
now works. It does not exist under Apple clang, so before this every submission
opening with that include failed on the host for a reason that had nothing to
do with the submitted code.

### Secrets

`.dockerignore` excludes `.env`, so the Mongo URI and Gemini key are never
copied into an image layer. They arrive at run time through `--env-file .env`.
This matters the moment an image is pushed anywhere: layers are readable by
whoever pulls them, and a key baked into one is a key that has leaked.

### How much isolation this actually buys

Submitted code can no longer read the host filesystem, and it runs as the
unprivileged `node` user rather than root. That is the practical win.

It is not a full sandbox. Server and submissions share one container, so
submitted code sits alongside the service's own environment. The container also
still has network access and no memory or process limits, which means a fork
bomb is not contained. Closing those gaps means a separate hardened container
per submission — `--network none`, `--memory`, `--pids-limit`, read-only
filesystem — which is a larger change and is not done here.

## Redis

Redis holds the AI rate limits and the cache of answers already paid for.
Nothing else uses it, and the judge does not touch it at all.

```bash
cd compiler
npm run docker:build    # docker compose build
npm run docker:start    # both containers, Redis first
npm run docker:logs     # follow the compiler
npm run redis:cli       # a shell into Redis
npm run docker:stop
```

### Why

Not scale. The four defences that stop the AI features emptying a free Gemini
key — one request in flight, a cache, a cooldown, an hourly and daily quota —
used to live in a `Map` inside the compiler process. The compiler restarts every
time judge code changes, and **each restart silently reset everyone's quota to
zero.** The counters guarding a paid key were being forgiven several times an
afternoon. Redis outlives the container.

The cache is the same argument in reverse: a Gemini answer already paid for was
thrown away on every restart and bought again.

### The keys

| Key | Type | Holds |
| --- | ---- | ----- |
| `oj:ai:hist:<userId>` | sorted set, scored by timestamp | one member per request, the sliding window behind both quotas |
| `oj:ai:lock:<userId>` | string, `NX` with a 60s expiry | the one in-flight slot per person |
| `oj:ai:ans:<sha256>` | string, expires after `AI_CACHE_TTL_MINUTES` | an answer already paid for |

The lock's expiry is the improvement over the `Set` it replaces: if a request
died between `begin` and `end`, the old code shut that person out until the
process restarted. A TTL cannot.

`NX` is also what makes the lock correct rather than merely present. `check()`
asks whether the slot is free and `begin()` claims it, and between those two
lines a second request can arrive — so `begin()` returns false when it loses the
race, and the caller turns that into a 429. Only the claim itself is atomic.

### When Redis is not there

Every function falls back to the in-memory maps, which is exactly the old
behaviour, so an outage is never worse than not having Redis at all. `GET /`
reports which store is live:

```json
"limitStore": { "enabled": true, "connected": true, "store": "redis" }
```

`"store": "memory"` means limits are back to resetting on restart.

The rule that makes the fallback work: **nothing ever waits for a connection.**
The obvious version of `redisClient.js` awaits `connect()` on every call, and it
deadlocks the moment Redis stops — node-redis sits in its reconnect loop and
requests that should degrade in a millisecond hang instead. So the connection is
opened once in the background and every operation asks only whether the socket
is ready right now, which is a synchronous check. Operations also carry a one
second ceiling, because a half-open socket accepts a command and never answers.

Set `REDIS_ENABLED=0` in `compiler/.env` to turn it off and go back to in-memory
counters.

## The submission queue

`POST /submit` no longer judges. It writes the job to Redis and answers at once
with an id; a worker takes it off the list, judges it, and writes the verdict
back; the browser polls until there is one.

```bash
cd compiler
npm run docker:start                      # redis + api + one worker
docker compose up -d --scale worker=3     # three workers
npm run worker                            # one on the host, to watch it print
```

### Why

Not throughput. A brute-force solution that times out holds its connection for
five seconds, and nothing capped how many could do that at once. Twenty people
pressing Submit during a demo meant twenty concurrent `g++` processes inside one
container. **The number of compilers running at once is now the number of
workers**, whatever the class does.

Measured, six brute-force submissions at once:

| workers | accepted in | all judged in |
| ------- | ----------- | ------------- |
| 1 | 618 ms | 38.0 s |
| 3 | 613 ms | 16.5 s |

The accept time barely moves, because accepting is now just a write.

### The shape of a submission

```
POST /submit          -> 202 { jobId, status: "queued", waitingAhead }
GET  /submit/:jobId   -> { status: "queued" | "running" | "done" | "failed", ...verdict }
```

`waitingAhead` is exact, from `LPOS`: jobs are pushed to the head and taken from
the tail, so what counts is the distance to the tail, not the length of the
queue. Counting the whole queue tells somebody alone in it that one submission
is ahead of theirs.

The browser polls every 350 ms and gives up after 90 seconds, because a worker
killed mid-job leaves its submission `running` for ever and a spinner that never
stops is worse than an error.

| Key | Holds |
| --- | ----- |
| `oj:judge:queue` | a list of job ids |
| `oj:judge:job:<id>` | the job and, once judged, its verdict; expires after `JUDGE_JOB_TTL_SECONDS` |

The submitted source is dropped from the job the moment there is a verdict.
Nothing reads it again, and a store full of other people's solutions is a
liability for no benefit.

### When Redis is not there

`POST /submit` judges inline and returns the verdict in that first reply,
exactly as it did before the queue existed. The reply says which happened: a
body with a `jobId` is one to poll, a body with a `verdict` is the answer, and
the page handles both. That is not defensive clutter — it is the condition on
which a queue was allowed in front of the judge at all.

`GET /` reports the mode:

```json
"queue": { "mode": "queued", "waiting": 0 }
```

`"inline"` means no workers are involved.

### One thing that is easy to get wrong

`BRPOP` is meant to block for seconds — that is how an idle worker waits without
spinning. The general Redis wrapper in `redisClient.js` races every command
against a one second ceiling, and putting `BRPOP` through it **silently loses
submissions**: the wrapper gives up at one second, the command keeps running,
pops a job, and nothing is listening. The job leaves the queue and is never
judged.

Blocking commands therefore go through `withBlockingRedis`, which has no timeout
and uses a connection of its own, because a blocking command occupies the socket
it was issued on.

## The judge

A submission is the Run button repeated once per test case, with the output
checked instead of displayed. The flow is the one in the sketch:

```
a.cpp + P.in   ->  Sol.txt         run the submission on one test's input
Sol.txt == P.out  ->  boolean      compare against the expected output
ten booleans   ->  verdict         Accepted, or whatever failed first
```

It lives in the compiler service because that is where the compiler already is.
Putting it in the accounts API would mean a second copy of the build and run
machinery.

### Where problems live

```
compiler/problems/
  two-sum/
    problem.json      title, statement, limits, starter code per language
    tests/1.in        P.in   the input handed to the program
    tests/1.out       P.out  the output it must produce
    tests/2.in ...    ten pairs per problem
  three-sum/
    ...
```

Files, not database rows. A test case is a file: you can open it, diff it, and
commit it. Adding a problem means adding a folder, with no migration and no seed
script. Everything is read once at startup and held in memory.

The first two tests of each problem are samples and travel to the browser. The
other eight never leave the server, whether the submission passes or fails. That
secrecy is the only thing separating a judge from a diff tool.

### Routes

| Method | Route              | Auth | Purpose                               |
| ------ | ------------------ | ---- | ------------------------------------- |
| GET    | `/problems`        | no   | list, without any test data           |
| GET    | `/problems/:slug`  | no   | one problem, samples only             |
| POST   | `/submit`          | yes  | judge `{ slug, language, code }`      |

Verdicts are `accepted`, `wrong_answer`, `compilation_error`, `runtime_error`,
`time_limit_exceeded` and `output_limit_exceeded`, alongside a `passed`/`total`
count and a per-test breakdown.

**Accepted requires `passed === total`**, not merely the absence of a failure.
Those differ when the judging budget runs out: tests that were never reached are
skipped rather than failed, so looking only for a failure once returned Accepted
for a submission judged on eight tests out of ten. Such a run is now reported as
a time limit, which is what actually happened.

The page shows one row per test with its number, status and time. A failed row
opens to show the input, the expected output and what the program printed, but
only for the examples. A hidden test says it is hidden and shows nothing.

### Custom test cases, and why they are not Submit

`POST /run-batch` takes `{ slug, language, code, cases }`, where each case is
`{ input, expected }`, compiles once, and runs every case against that binary.
Expected output is optional per case: fill it in and the case is compared and
reported passed or failed, leave it blank and it simply runs and shows what was
printed.

These never produce a verdict. Run is for debugging against input you made up;
Submit is the official answer against the problem's own tests. Keeping them
apart is what stops a page claiming Accepted because three cases the solver
wrote themselves happened to pass.

### Three decisions worth knowing

**Output comparison is not byte-for-byte.** Trailing whitespace is stripped from
the end of every line and blank lines from the end of the file. Spacing inside a
line still has to match. Failing someone for a missing final newline is the most
common way a judge wastes an afternoon.

**Time limits are per language.** A problem states one number; `languages.js`
multiplies it by 1 for C and C++, 2 for Java and 3 for Python. The same correct
algorithm is simply slower in an interpreter, and holding every language to one
wall-clock figure fails correct Python for being written in Python.

**Nothing about a submission is stored.** Writing verdicts to a submissions
collection would mean giving this service database credentials. Keeping MongoDB
to a single owner is worth more right now than a submission history, so that is
the obvious next thing to add rather than something missing by accident.

### Regenerating the test data

The tests were built by `scripts/generate-tests.js` from reference solutions, so
the expected outputs are not hand-typed. It is seeded: running it again produces
byte-identical files.

```bash
node scripts/generate-tests.js
```

## Laying out the problem page

The two columns are separated by a divider you can drag, and the width you pick
is remembered in browser storage. Double click it to reset, or nudge it with the
arrow keys when it has focus. Below the large breakpoint the columns stack and
the divider disappears, because there is no width left to divide.

The statement, the editor, the judge and the custom tests each have a drag
handle on their bottom edge. Shrinking one makes its content scroll inside
rather than pushing everything below it down the page.

This replaced a fixed half-and-half grid, which stretched the shorter column to
match the taller one and left a blank area several hundred pixels deep under the
problem statement.

One consequence worth knowing: a scrollable panel is a scroll container, so
`scrollIntoView` inside one scrolls the panel rather than the page.

### Starter code

`frontend/src/starters.js` holds the boilerplate an empty editor opens with.

A problem may carry its own, written by whoever authored it, and the two
migrated problems do: theirs parses that problem's exact input format and leaves
a comment where the answer goes. Problems written through the Add Problem page
carry none, and before this their editor opened completely empty in every
language. The problem's own starter wins; `DEFAULT_STARTERS` fills in for every
language it does not cover.

One rule is not negotiable: **the Java class must be called `Main`.**
`languages.js` writes the submitted source to a file named `Main.java` and runs
`java -cp <dir> Main`, because javac insists a public class live in a file of
the same name. A skeleton calling it `Solution` fails to compile before the
solver has typed anything, and the error points at the boilerplate rather than
at them.

Every skeleton compiles and runs as it stands, reading nothing and printing
nothing, so Run on an untouched editor gives an empty result rather than an
error.

The standalone compiler page uses a different set, `COMPILER_STARTERS`, which
adds two numbers. That page has no problem attached, so nothing otherwise tells
a visitor the editor is wired to the input box below it.

### Drafts belong to one account

Whatever you type in the editor is saved to the browser as you go, so a refresh,
a stray click, or an expired session does not throw it away.

The storage key is `oj_draft:<userId>:<slug>:<language>`, and the user id in the
middle is not decoration. Without it there is one draft per problem per browser,
so signing out and signing in as somebody else handed the new person the
previous one's half-finished solution, already sitting in the editor. On a
shared machine that is someone else's work given to a stranger; in a computer
lab it is a way to copy an answer without even meaning to.

Logging out also wipes every draft in the browser. An expiring token does not,
and the difference is deliberate: an expired session means the same person is
about to sign back in and would be furious to lose what they had typed, while
logging out is someone leaving a machine that may not be theirs.

Nothing about a draft reaches the server, and no submission is stored anywhere,
so this is the only place a solver's code persists at all.

## Adding a problem

Problems live in MongoDB and are written through the Add Problem page, which
appears in the navbar only for an account on the server's allowlist.

Set that allowlist in `backend/.env`:

```
ADMIN_EMAILS=you@example.com
```

Empty means nobody, and the page says so rather than failing oddly. The check
runs on the server for every `/admin` route, so hiding the link is tidiness
rather than the control.

### Why a reference solution is required

This is the part worth understanding, because it shapes the whole form.

Constraints describe what an input may look like, so a generator can build as
many valid inputs as you like. Nothing in a constraint says what the correct
**output** is. A judge needs both.

So the author supplies a solution they trust. Every generated and curated input
is run through it, and whatever it prints becomes the expected output. The
reference solution is the definition of correct; the generator only decides what
it gets asked. It is written in any of the four supported languages and runs
through the same compiler that judges submissions.

The examples typed into the form are checked against it before anything is
saved. If they disagree, the save is refused and both values are shown side by
side. One of the two is wrong, and finding out here is much better than finding
out from a solver whose correct answer was marked wrong.

### The two kinds of test case

**Curated**, typed by the author: the cases a generator cannot think of.
Smallest and largest allowed input, all duplicates, negative values, overflow
risk, whatever the problem makes awkward. Only the input is typed; the expected
output comes from the reference solution.

**Generated**, built from an input shape: a ladder of cases climbing
geometrically from the smallest allowed size to the largest, so the early ones
are quick and the late ones are what a slow algorithm fails. Same seed, same
inputs, byte for byte, on any machine.

Both matter, and the split is not academic. A problem asking for the number of
distinct values in an array, whose examples all happen to hold positive numbers,
will accept a solution that quietly ignores negatives. The generated cases
contain negatives and fail it on test 5.

### The input shape

The generator takes a list of fields, written in the order they appear in the
input:

| Type | What it produces |
| ---- | ---------------- |
| Single integer | one number in a range; tick **Grow across cases** for the size field |
| Array of integers | a line of numbers, its length either fixed or the name of an earlier field |
| Sum of k array values | a number that really is the sum of k distinct elements of a named array |

The third exists because a random number is useless for a problem like Two Sum,
where the target has to be reachable. It is the one problem-specific pattern
common enough to build in. Anything else the constraints promise but a range
cannot express — "exactly one pair adds up to the target" — belongs in a
curated case.

**Read from constraints** fills this in from the lines already typed. It
understands `1 <= n <= 200000` and `-10^9 <= a[i] <= 10^9`, and skips anything
in prose, so treat it as a first draft rather than an answer.

**Preview inputs** builds the inputs and shows their sizes without running
anything or writing anything.

### How much a submission may print

A problem's output limit is measured, not typed. The reference solution has
just printed the correct answer to every test, so the largest of those is
exactly what a correct submission must be allowed to produce. The problem stores
twice that, with a floor of the usual 64 KB and a ceiling of 8 MB.

This matters more than it looks. "Rotate an array of up to 100000 integers"
has an answer around 1.2 MB, and the default 64 KB ceiling rejects it — first
when the reference solution runs, with *Reference solution failed on input 18:
Program printed more than 65536 bytes*.

The tempting fix is to raise the limit for the reference run alone. That is a
trap: the problem then saves, and every correct submission to it is killed with
Output Limit Exceeded, because judging still uses the old ceiling. The limit has
to be one number used in both places, which is why `runJob` takes it as an
argument rather than reading a module constant.

Problems written before this existed have no stored limit and fall back to the
64 KB default, which is what they were built against.

### Where it all ends up

```
MongoDB   problems     the statement, constraints, examples, reference
                       solution, generator spec, and a manifest of tests
disk      testdata/<slug>/1.in, 1.out, 2.in …
```

Test data is deliberately not in the document. One problem here is already four
megabytes of tests and a MongoDB document may not exceed sixteen, so a handful
of generated problems would hit the ceiling. The document holds the manifest:
which tests exist, in what order, which are samples, their byte sizes, and the
file each one lives in.

Writes belong to the accounts API alone. The compiler service only reads, so the
two can never disagree about what a problem is, and `testdata/` can stay mounted
read-only in the container that runs submitted code.

### Migrating the original two

`two-sum` and `three-sum` began as folders under `compiler/problems/`. They were
moved with:

```bash
node scripts/migrate-problems-to-mongo.js
```

Safe to run twice; it upserts by slug. It copies rather than moves, so
`compiler/problems/` is still there as a backup and nothing reads it any more.

## The AI features

Two of them, and both go through one Gemini integration: `geminiClient.js` holds
the key, the model, the timeout and the error mapping. A second copy would mean
a second place to fix when Google retires a model name, and they do that often.

**Neither is required for judging.** If Gemini is down, out of quota, or has no
key at all, `/submit` and `/run-batch` behave exactly as before. A judge that
could not decide a verdict without a language model would stop working whenever
someone else's service did.

### Time complexity

After a verdict, a purple panel reads the code and reports the best, average and
worst case. Three figures, nothing else.

### Coding assistant

After a **failed** submission or a failed custom test, a panel appears with the
assistant avatar and offers to help. On an Accepted run it stays hidden: the
check is `passed === total`, the same rule the server uses, so it cannot appear
on a submission the judge called Accepted.

It is a mentor, not a solver. Four actions:

| Action | What it does |
| --- | --- |
| Explain the error | What went wrong, which line, and why |
| Show a hint | Four levels, each saying more than the last |
| Ask | A free-text question about your own code |
| Show the full solution | Only behind an explicit second click |

The hint ladder is the point: level 1 is a conceptual nudge with no line number,
level 2 points at the region, level 3 states the mistake, level 4 may show a
two or three line fragment. Only the "full" action may return a whole program,
and the server strips `fullSolution` from every other action, so a chatty model
cannot slip the answer through a hint.

The code is sent with line numbers attached. Without that the model would be
counting newlines by eye, and the line it names would not match your editor.

A hidden test's input and expected output never leave the server. The assistant
is told the test is hidden rather than handed blanks it might invent around.

### Adding your API key

1. Get one at https://aistudio.google.com/apikey
2. Paste it after `GEMINI_API_KEY=` in `compiler/.env`
3. Restart the compiler service

### Protecting the quota

Every AI request passes four gates, all on the server. Disabling a button in the
browser stops an honest click and nothing else: anyone can post to the endpoint
directly.

1. **One at a time per person.** Three impatient clicks on Next Hint become one
   call, not three.
2. **Cache.** The same question about unchanged code returns the answer already
   paid for, and does not count against anyone's allowance. Closing the panel
   and reopening it is free.
3. **Cooldown**, a few seconds between calls.
4. **Quota**, per hour and per day. Checked before the cooldown, because telling
   someone who is out of requests to wait five seconds would be true and
   useless.

Everything sent is truncated first: source, statement, compiler output, and test
data all have caps, so a two-megabyte test input cannot become a two-megabyte
prompt. Replies are capped too, higher for a full solution than for a hint.

All of it is configurable in `compiler/.env`:

| Setting | Default |
| --- | --- |
| `AI_REQUESTS_PER_HOUR` | 10 |
| `AI_REQUESTS_PER_DAY` | 30 |
| `AI_REQUEST_COOLDOWN_SECONDS` | 5 |
| `AI_CACHE_TTL_MINUTES` | 30 |
| `AI_MAX_OUTPUT_TOKENS` | 700 |
| `AI_MAX_OUTPUT_TOKENS_FULL` | 1600 |
| `AI_MAX_CODE_CHARS` | 8000 |

Status codes are meaningful: **429** for rate limited or busy, **503** for no key
configured, **502** for a model that refused, **400** for a bad request. The page
says which, rather than showing a generic error.

The counters live in memory, which is the right size for one compiler process. A
restart forgives everyone. Running several processes would mean moving them to
Redis or Mongo, and nothing else would change.

## Staying up when the network does not

Both services run on a connection whose only nameserver is an IPv6 link-local
address, so `DNS_SERVERS` points Node at a public resolver for the SRV lookup
that `mongodb+srv://` needs. That resolver is not always reachable, and two
things used to turn a momentary DNS failure into a dead service.

**A failed connection was remembered.** `connectClient` assigned `client` before
awaiting `connect()`, so a failure left a truthy client that was never
connected. Every later call skipped connecting and handed out a database handle
on a socket that had never opened — broken until restart, with no way back. The
handle is now published only after `connect()` returns, and a failure clears the
in-flight promise so the next caller genuinely retries.

**An unhandled rejection killed the process.** The driver re-resolves the SRV
record on a timer of its own, so when that lookup timed out the rejection
belonged to a promise nothing awaited, and Node exits on those. The compiler
died three times in one afternoon this way, taking judging down with it —
including `/run`, which needs no database at all. `stayAlive.js` logs those and
carries on. `uncaughtException` is deliberately not handled the same way: an
exception that escaped every try/catch leaves a state nothing can reason about,
and restarting is better than continuing.

Mongo operations also now give up after `MONGO_SERVER_SELECTION_TIMEOUT_MS`
(8 seconds) instead of the driver's thirty, because a health check that hangs
looks exactly like a service that has died.

## Known limitation

Submitted code runs directly on the host as your own user. The wall-clock kill
and the output cap stop the obvious accidents, but a program here can still read
your files and open network connections. That is fine on your own machine and
not fine on a public server. Docker containers per language, as in the
architecture diagram, are the next stage.
