# Deploying ZYOSEE on Vercel + Render (free)

Everything here fits free plans. The alternative — one EC2 box running
`deploy/docker-compose.prod.yml` — is documented in [../README.md](../README.md)
and is still the better choice if you want HTTPS on a custom domain, no cold
starts, or the multi-worker scaling story intact. This path trades those for
automatic HTTPS, `git push` deploys, and no instance to administer.

## The shape

| Piece | Runs on | Why there |
|---|---|---|
| React frontend | Vercel | Static files. A CDN serves them free and **never sleeps**, so the site always paints instantly. |
| Accounts API + WebSockets | Render web service | Needs a long-lived process. Render supports WebSocket upgrades on free. |
| Compiler + judge + worker | Render web service (Docker) | Needs g++, a JDK and python3 in the image. |
| Redis | Render Key Value | The submission queue. |
| MongoDB | Atlas M0 | Unchanged from every other deployment. |

**The worker is not its own service.** Render's background workers are a paid
type, so `compiler/start-service.js` runs the API in the main process and forks
one worker beside it. If Redis is ever unreachable the judge falls back to
judging inline on the request thread — slower, still correct.

## Order matters

There is a loop in the configuration: Render needs the Vercel URL to allow it
through CORS, and Vercel needs the Render URLs compiled into its bundle. Neither
exists at the start. Do it in this order and you go round the loop once.

### 1 — Commit the test data

Render builds from the repository, so the tests must be in it. `.gitignore` has
already been changed to allow this, with the trade written out in the file.

```bash
git add -A && git commit -m "Add Render and Vercel deployment configuration"
```

That stages about 2,350 files and 122 MB. Push it.

### 2 — Atlas network access

**Render's free plan has no static outbound IP**, so the allowlist has to be
`0.0.0.0/0`. The database user's password becomes the only thing guarding it —
generate a long random one and do not reuse it.

Skipping this produces a server-selection timeout that reads like a broken app
rather than a firewall.

### 3 — Apply the blueprint

Render dashboard → **New → Blueprint** → pick this repo. It reads
[`render.yaml`](../../render.yaml) and creates all three services.

The judge builds a Debian image with three toolchains, so the first build takes
**15–25 minutes**. Later ones reuse cached layers.

Then set the values marked `sync: false`:

| Variable | On | Value |
|---|---|---|
| `MONGODB_URI` | both services | your Atlas string |
| `CLIENT_URL` | both services | leave blank, filled in at step 5 |
| `COMPILER_URL` | `zyosee-api` only | the judge's **public** URL, e.g. `https://zyosee-judge.onrender.com` |

`COMPILER_URL` is optional and only admin problem authoring uses it. It must be
the public URL, not an internal hostname: free services cannot receive private
network traffic from each other.

`JWT_SECRET_KEY` is generated once on the API and pulled into the judge
automatically. Do not set it by hand on only one of them: mismatched secrets
give you a site where logging in works and every submission returns 401.

Note the two URLs Render assigns, e.g. `https://zyosee-api.onrender.com`.

### 4 — Vercel

New project → this repo → **Root Directory: `frontend`**. Vite is detected
automatically.

Add the two build-time variables from step 3, absolute and with no trailing
slash — see [../../frontend/VERCEL.md](../../frontend/VERCEL.md) for why the
scheme in particular is load-bearing for WebSockets:

| Variable | Value |
|---|---|
| `VITE_AUTH_URL` | `https://zyosee-api.onrender.com` |
| `VITE_COMPILER_URL` | `https://zyosee-judge.onrender.com` |

Deploy. Note the Vercel URL.

### 5 — Close the loop

Back on Render, set `CLIENT_URL` on **both** services to the Vercel URL. Both
restart on their own.

This is the step people skip. Without it every request from the browser fails
CORS, and the browser reports it as a network error, which sends you looking for
a server that is actually running perfectly.

## Check it

Both of these should answer JSON:

```bash
curl -s https://zyosee-api.onrender.com/ && curl -s https://zyosee-judge.onrender.com/
```

The judge's response includes `"mode"`. **`queued` means Redis is connected and
the worker is consuming. `inline` means it is judging on the request thread** —
fine, but not what the blueprint intends, so check `REDIS_URL` on the service.

Then, in the browser: sign up, open a problem, submit. A verdict exercises the
whole chain — Vercel → Render API → judge → Redis → worker → test files → Atlas.
Open Pair Lab in two tabs to confirm the WebSocket upgrade works over `wss://`.

## What free actually costs you

All of this is from Render's own documentation, checked rather than remembered.

**750 instance hours per workspace per month — shared.** This is the limit that
bites, and it is easy to misread. It is per *workspace*, not per service, and
this blueprint has **two** web services. A month is about 730 hours, so two
services running continuously would want ~1,460 and you would be suspended
until the next month.

What saves you is the thing that also annoys you: a spun-down service consumes
no hours. A portfolio site that is idle most of the day stays well inside the
budget. A site you keep awake by pinging it does not — that burns hours twice as
fast as wall-clock and runs out around day fifteen. There is no configuration
that fixes this; only moving one service to a paid plan does.

**Spin-down after 15 minutes idle, about a minute to come back.** WebSocket
messages count as traffic, so an open Pair Lab session keeps the API awake.
The frontend is on Vercel precisely to limit the blast radius: the page always
paints instantly and only the first API call waits.

While a service is spun down, Render answers `/robots.txt` with `Disallow: /`
on its behalf. Harmless here, but it means the API is never indexed.

**Free Key Value is in-memory only.** It does not persist to disk, so a restart
loses everything in it — and Render may restart a free instance whenever it
likes. For us that means queued-but-not-yet-judged submissions can vanish on a
restart, and the person sees a job that never finishes. Submitting again works.
Worth knowing it is a real failure mode and not something the code can fix:
`BRPOP` is at-most-once to begin with.

Only **one** free Key Value instance is allowed per workspace, so this blueprint
uses your one.

**512 MB of RAM**, shared by the API, the forked worker, and whatever g++ is
compiling. Hence `JUDGE_WORKERS=1` and `PROBLEM_CACHE_BYTES=32MB`. Both are
deliberate; raising either risks an OOM that takes the service down rather than
just the submission.

**The private network is one-way.** A free service may send private requests to
a data store — that is how the judge reaches Key Value — but may not *receive*
private traffic from another service. This is why `COMPILER_URL` is the judge's
public URL rather than an internal hostname.

**No shell access on free.** No SSH, no dashboard shell. When something misbehaves
you have logs and the `/` endpoint, nothing else. Reproduce locally with
`docker build -f deploy/render/Dockerfile.compiler .` instead.

**Atlas access counts as service-initiated traffic**, which Render says it may
suspend a free service for if the volume is "uncommonly high". Normal use is
nowhere near it; a runaway polling loop would be.

**No per-submission resource limits.** On EC2, compose sets `mem_limit`,
`pids_limit` and `cpus` per container, so a fork bomb hurts only its own
container. Here the service *is* the container: a submission that forks without
limit takes the website with it until Render restarts it. The judge's wall-clock
timeout is the only thing in front of that. Acceptable for a portfolio
deployment with a known audience; not something to point a crowd at.

## If something is wrong

| Symptom | Cause |
|---|---|
| Build fails on `COPY deploy/testdata/` | Test data was not committed. See step 1. |
| Login works, submissions 401 | `JWT_SECRET_KEY` differs between the two services. Delete the override on the judge and let `fromService` supply it. |
| Browser shows network errors on every call | `CLIENT_URL` not set to the Vercel URL. Step 5. |
| Server selection timeout | Atlas allowlist. Step 2. |
| Pair Lab and duels never connect | `VITE_AUTH_URL` is relative or missing `https://`, so the socket URL is not `wss://`. Fix and **redeploy** — Vite bakes it in at build time. |
| Judge reports `"mode":"inline"` | `REDIS_URL` is unset or the Key Value service is down. Submissions still work. |
| A submission never finishes | Free Key Value restarted and lost the queue. Submit again. |
| "Could not reach the compiler service" when saving a problem | `COMPILER_URL` unset on the API. Set it to the judge's **public** URL — the private network does not work in that direction on free. |
| All services suspended mid-month | 750 shared instance hours exhausted. They reset on the 1st. |
| First request takes a minute | Cold start. Expected. |
