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

Then set the two values marked `sync: false`, **on both** `zyosee-api` and
`zyosee-judge`:

- `MONGODB_URI` — your Atlas string
- `CLIENT_URL` — leave it for now, you fill it in at step 5

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

**Services sleep after about 15 minutes idle.** The next visitor waits roughly
30–60 seconds while the container starts. For a link on a résumé this is the one
that stings: a recruiter may see a blank page and leave. Nothing in the free
plan fixes it — only upgrading one service does. (Pinging yourself to stay awake
burns the same monthly instance hours and is explicitly against the spirit of
the plan; you also run out of hours before the month does.)

The frontend is on Vercel precisely to limit the damage: the page itself always
loads instantly, and only the first API call waits.

**512 MB of RAM**, shared by the API, the forked worker, and whatever g++ is
compiling. Hence `JUDGE_WORKERS=1` and `PROBLEM_CACHE_BYTES=32MB` in the
blueprint — both are deliberate, and raising either risks an OOM kill that takes
the site down rather than just the submission.

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
| First request takes a minute | Cold start. Expected. |
