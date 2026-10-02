# Deploying the frontend to Vercel

Set **Root Directory** to `frontend` in the Vercel project settings. Vercel then
detects Vite on its own and needs no build configuration.

## Why vercel.json exists

One rule, and without it the site is subtly broken.

React Router does its routing in the browser, so `/problems` is not a file on
disk — it is a path the already-loaded app interprets. That works when you
arrive at `/` and click through. It does not work when somebody pastes a link to
`/problems`, or presses F5 on it: the browser asks the CDN for a file at that
path, there isn't one, and the visitor gets a 404 on a page that works fine if
you reach it the other way. The rewrite makes every path that matches no real
file serve `index.html`, which hands routing back to the app.

The order matters and Vercel gets it right by default: a request is matched
against real static files *first*, so `/assets/index-abc123.js` is still served
as the actual asset and never swallowed by this rule.

## Environment variables

Both are read by Vite **at build time**, not at run time — `import.meta.env` is
substituted into the bundle when it is compiled. Changing either one in the
Vercel dashboard therefore does nothing until you redeploy.

| Variable | Value |
|---|---|
| `VITE_AUTH_URL` | `https://zyosee-api.onrender.com` |
| `VITE_COMPILER_URL` | `https://zyosee-judge.onrender.com` |

Both must be **absolute URLs including the scheme, with no trailing slash.**

The scheme is not cosmetic. The WebSocket clients for Pair Lab and the Duel
Arena build their URL by rewriting this one:

```js
VITE_AUTH_URL.replace(/^http/, "ws")
```

An `https://` value becomes `wss://`, which is what a page served over HTTPS is
allowed to open. A relative value, or one missing the scheme, produces a
WebSocket URL that the browser refuses as mixed content — and the failure shows
up as Pair Lab and duels silently never connecting, while the rest of the site
looks fine.
