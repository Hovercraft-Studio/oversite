# Deployment

Oversite can run locally on a LAN or be deployed to the cloud. Both modes are production-ready.

## Local Network

The original use case: run Oversite on a machine connected to the same network as all installation clients (PCs, tablets, touchscreens, microcontrollers).

### Running Locally

```bash
# Development (Vite dev server + nodemon)
npm run dev

# Production (build first, then serve)
npm run build
npm start
```

Default ports:
- `3002` — Vite dev server (frontend assets)
- `3003` — Express + WebSocket server (API + WS relay)

In production (`npm start`), everything is served from port `3003` — Vite is not involved.

### Local Network Access

To allow other devices on the LAN to connect:

1. Find the host machine's IP: `npm start` logs the local IP address on startup
2. Clients connect to `ws://{local-ip}:3003/ws` instead of `localhost`
3. Set `wsURL` in the page hash (this is done automatically, but can be overridden to point to remote servers): `http://{local-ip}:3002/#&wsURL=ws://{local-ip}:3003/ws`

The server detects and logs available network interfaces on startup via `src/server/util.mjs`.

## Cloud: DigitalOcean App Platform

For remote installations, visitor-facing apps, or team access from anywhere, deploy to DigitalOcean App Platform.

### Setup

1. Push the repo to GitHub
2. Create a new App on DigitalOcean App Platform
3. Connect to the GitHub repo
4. Configure:
   - **Build command**: `npm run build`
   - **Run command**: `npm start`
   - **HTTP port**: `3003`
5. Set environment variables (see below)

DigitalOcean App Platform handles HTTPS/WSS automatically — no SSL configuration needed.

### WebSocket on DigitalOcean

DigitalOcean App Platform supports WebSockets. Clients connect to:
```
wss://your-app.ondigitalocean.app/ws?sender=tablet&channel=default
```
Note `wss://` (TLS), no port, and the `/ws` path with querystring params.

### Build Notes

The `package.json` includes a prebuild step that installs a platform-specific Rollup binary for DigitalOcean's Linux build environment:
```bash
"prebuild": "npm install @rollup/rollup-linux-x64-gnu --no-save || true"
```
In production, `process.env.PORT` is used for the Express server port (DigitalOcean injects this). The `dist/` folder is served as static files by Express.

### Ephemeral Storage

The `_tmp_data/` directory (used for persistent state and dashboard check-ins) is **ephemeral** on App Platform — it is wiped on every redeploy. This means:
- AppStore state is reset on redeploy
- Dashboard check-in history is lost on redeploy

For durable storage, a future migration to DigitalOcean Spaces or a database is planned. See [roadmap](./roadmap.md).

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server mode
NODE_ENV=development   # or "production"

# Auth
# Comma-separated "username:password" pairs
AUTH_USERS=admin:password,operator:password2
# Can set to true locally to test as if we're running in production (e.g. to test auth flows). On App Platform, this is always true.
VITE_FORCE_LOCAL_AUTH=true

# WebSocket channels
# Comma-separated list of allowed channel names
ALLOWED_WS_CHANNELS=default,lights,audio

# Dashboard offline alerts
# Comma-separated project IDs to monitor
ALERT_PROJECT_IDS=installation-nyc,installation-la
# Slack incoming webhook URL
ALERT_SLACK_HOOK_URL=https://hooks.slack.com/services/...
```

On DigitalOcean, set these as environment variables in the App Platform dashboard — do not commit `.env` to git.

## Using Oversite as an npm Module

External apps can install Oversite as a dependency instead of running it as a standalone server:

```bash
npm install oversite
```

In your frontend JS entry point:
```js
import "oversite/src/components/_register-components.js";
import "oversite/shared/css/pico.css";
import "oversite/shared/css/styles.css";
import MobileUtil from "oversite/src/util/mobile-util.mjs";
```

To update after Oversite has been updated:
```bash
npm update oversite
# restart dev server
```

See `examples/oversite-module/` for a complete example:
- `examples/oversite-module/backend/` — Node.js backend using `DashboardPoster`
- `examples/oversite-module/frontend/` — Vite frontend importing Oversite components

### Private Repo + Vercel Limitation

Since Oversite is a private GitHub repo, Vercel cannot run `npm install` during its build step (no SSH key access). Current workaround:

1. Run `npm run build` locally
2. Commit the `/dist` folder (remove `dist` from `.gitignore`)
3. Replace the Vercel build command with `npm run skip-build`

When Oversite becomes a public repo, revert these steps and use a normal Vite build.

## Running Behind HTTPS

Some browsers (notably iOS Safari) require a secure context — `https://` for the page and `wss://` for its WebSocket — before allowing `getUserMedia` (webcam) or other hardware access, even on a local network. `app-store-init.js` always mirrors the page's own protocol (`document.location.protocol`): on an `https://` page it defaults to `wss://` on the page's **own origin** (`document.location.host`, whatever port that is) rather than the relay's port directly — hitting the relay's port directly would still be mixed content, since nothing terminates TLS there.

That means something has to proxy `/ws` (and any REST calls under `/api`) from the page's own origin through to the plain `ws://`/`http://` relay. Oversite's own `vite.config.js` already does this for local dev, since its Vite dev server always runs over HTTPS (`@vitejs/plugin-basic-ssl`):

```js
// vite.config.js
server: {
  https: true,
  proxy: {
    "/ws": { target: "ws://localhost:3003", ws: true },
    "/api": "http://localhost:3003",
  },
}
```

The browser only ever opens one same-origin `wss://.../ws` connection to Vite's own port; Vite forwards the insecure hop to the relay server-side, where mixed-content rules don't apply. A consumer project fronted by its own reverse proxy instead of Vite would proxy the same two paths there.

This requires no changes to Oversite's relay itself. Cloud deployments (DigitalOcean App Platform, Vercel) already terminate TLS in front of the app on one origin, so the same same-origin default just works there without any proxy config.

### Verifying It Works

`<app-store-webcam>` (see [`docs/references/web-components.md`](./web-components.md)) is a concrete end-to-end test: it's on the `app-store-demo` page (`key="webcam_photo"`), and `getUserMedia` succeeding from a phone/tablet on the LAN — not just `localhost` — confirms the secure-context websocket is actually connected, not just that the default URL scheme looks right.

## Monitoring a Deployment

Once deployed:
- Access the Dashboard at `https://your-app.ondigitalocean.app/dashboard/`
- Access the App Store Monitor at `https://your-app.ondigitalocean.app/app-store-monitor/`
- Both require login (configured via `AUTH_USERS`)
