# Backend Architecture

The backend is a single Node.js process (`server.mjs`) that composes four independent modules. No microservices, no build step — files run directly with Node.

See [`ARCHITECTURE.md`](../ARCHITECTURE.md) for the system diagram and end-to-end flows.

## Entry Point: `server.mjs`

Responsibilities:
1. Load config from `.env` and CLI args
2. Create HTTP server (Express) and WebSocket server (`ws`)
3. Instantiate and wire together all server modules
4. Serve static files from `dist/` (production) or `public/`

```js
const config = {
  stateDataPath, allowedWsChannels, authUsers,
  dashboardDataPath, dashboardApiRoute,
  isProduction, baseDataPath, ipAddr
};

const authApi       = new AuthApi(app, express, config.authUsers);
const socketServer  = new SocketServer(wsServer, app, config.stateDataPath, config.allowedWsChannels);
const dashboardApi  = new DashboardApi(app, express, config.dashboardDataPath, ...);
await dashboardApi.init();
const offlineAlerts = new OfflineAlerts(dashboardApi, alertProjectIds, slackApiHookUrl);
```

## Modules

### `src/server/socket-server.mjs` — SocketServer

Manages WebSocket connections and message relay.

- Parses `?sender`, `?channel`, `?sendonly` from connection URL
- Routes clients into channel buckets; creates/deletes channels dynamically
- Relays incoming messages to all channel peers (broadcast) or a specific client (`receiver` field)
- `sendonly` clients never receive messages
- Monitor clients (`sender="monitor"`) receive all messages including unicast
- Broadcasts `client_connected`, `client_disconnected`, and updated `clients` array on join/leave
- Sends AppStore heartbeat `{ key: "💓", value: "💓" }` to all channels every 30s
- Exposes: `GET /api/state/channels`, `/api/state/clients`, `/api/state/clients/:id`

### `src/server/persistent-state.mjs` — PersistentState

Persists AppStore state to disk and serves it via REST.

- Listens directly on the `ws` server for any message with `store: true`
- Stores the full message object (including `sender`, `time`) in memory keyed by `key`
- Writes to `_tmp_data/state/state.json` — rate-limited to once per second
- Loads state from disk on startup (survives server restarts, not redeploys)
- Exposes: `GET /api/state/all`, `/api/state/get/:key`, `/api/state/wipe`, `/api/state/wipe/:key`

### `src/server/dashboard-api.mjs` — DashboardApi

Ingests app check-ins and serves the dashboard data.

- Accepts `POST /api/dashboard` (JSON body, `appId` required)
- Decodes base64 images (`imageScreenshot`, `imageExtra`) and saves as PNGs
- Maintains `history` array per project (max 100 entries); prunes old images from disk
- Stores all data in `_tmp_data/dashboard/projects.json`
- Exposes: `GET /api/dashboard/json`, `/api/dashboard/json/:appId`, `/api/dashboard/delete/:appId`
- Static image serving: `GET /api/dashboard/images/...`

### `src/server/offline-alerts.mjs` — OfflineAlerts

Monitors dashboard data and sends Slack notifications.

- Polls in-memory dashboard data every 60 seconds
- Fires Slack webhook when a monitored project hasn't checked in for >20 minutes
- Also fires when a project comes back online (recovery alert)
- Configured via `ALERT_PROJECT_IDS` and `ALERT_SLACK_HOOK_URL` in `.env`

### `src/server/auth-api.mjs` — AuthApi

Simple username/password auth against `.env`.

- `POST /api/auth/login` — validates credentials, sets session cookie
- `POST /api/auth/logout` — clears session
- `GET /api/auth/check` — returns current auth status
- Users configured as `AUTH_USERS=admin:password,user2:pass2` in `.env`
- Auth state stored in server-side sessions (not JWT)

## Data Paths

All runtime data lives under `_tmp_data/` (gitignored):

```
_tmp_data/
├── state/
│   └── state.json          ← AppStore persistent state
└── dashboard/
    ├── projects.json        ← all check-in data
    └── images/             ← saved screenshots
        └── {appId}-{ts}-screenshot.png
```

In production (`NODE_ENV=production`), paths shift to `dist/_tmp_data/` so they sit alongside the static build.

## Logging

Use the color utilities from `src/server/util.mjs` instead of raw `console.log`:

```js
import { logBlue, logGreen, logMagenta, logCyan, logRed } from './util.mjs';

logGreen('✅ Client connected');
logMagenta('Dashboard data written');
```

Convention: each module uses one color consistently — green for socket-server, magenta for dashboard-api, cyan for offline-alerts.

## Config Pattern

Config is assembled once in `server.mjs` as a plain object and passed as constructor args. There is no global config singleton — all modules receive what they need on construction. A `ServerContext` class to formalize this is a planned refactor. See [`docs/exec-plans/tech-debt-tracker.md`](exec-plans/tech-debt-tracker.md).

## ES Module Conventions

- All backend files use `.mjs` extension
- `import`/`export` only — no `require()`
- Derive `__dirname` via `fileURLToPath(import.meta.url)`
- Bind methods in `constructor` when passing as callbacks
