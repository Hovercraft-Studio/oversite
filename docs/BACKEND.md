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

// Optional — enable with --system-commands flag or SYSTEM_COMMANDS=true in .env
if (enableSystemCommands) {
  const sysStore = new AppStoreDistributed(`ws://127.0.0.1:${PORT}/ws`, "system_commands", "dashboard");
  const systemCommands = new SystemCommands(sysStore);
}
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
- Also registers all persistent state routes: `/api/state/all`, `/api/state/get/:key`, `/api/state/wipe`, `/api/state/wipe/:key` — all accept `?channel=` query param

### `src/server/persistent-state.mjs` — PersistentState

Persists AppStore state to disk — one file per channel.

- Pure data store — no longer listens on `wsServer` directly; `SocketServer` routes messages to the correct channel's store in `handleMessage`
- Stores the full message object (including `sender`, `time`) in memory keyed by `key`
- Each channel gets its own file: `_tmp_data/state/state-{channelId}.json`
- Write rate-limited to once per second
- Loads state from disk on startup (survives server restarts, not redeploys)
- `SocketServer` owns all REST endpoints (see below) — PersistentState has no routes of its own

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

### `src/server/system-commands.mjs` — SystemCommands (optional)

Executes OS-level commands on the local machine, triggered by AppStore messages. Disabled by default — enable with the `--system-commands` CLI flag or `SYSTEM_COMMANDS=true` in `.env`.

- Connects as an AppStore client on the `dashboard` channel via its own `AppStoreDistributed` instance
- Listens for command keys: `kill_process`, `restart_computer`, `send_keys`, `minimize_windows`, `list_processes`
- Responds on `{key}_response`, routed back to the requester via `receiver`
- All inputs are sanitized with regex allow-lists
- Custom commands can be registered at runtime via `addCommand(name, handler)`
- Also runs standalone on any PC — see [`docs/product-specs/system-commands.md`](product-specs/system-commands.md)
- Dynamically imported (`await import()`) — modules are not loaded unless enabled

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
│   ├── state-default.json       ← "default" channel state
│   ├── state-dashboard.json     ← "dashboard" channel state
│   └── state-{channelId}.json   ← one file per channel
└── dashboard/
    ├── projects.json             ← all check-in data
    └── images/                  ← saved screenshots
        └── {appId}-{ts}-screenshot.png
```

In production (`NODE_ENV=production`), paths shift to `dist/_tmp_data/` so they sit alongside the static build.

**Migration from pre-channel state:** If upgrading from a version that used a single `state.json`, rename it to `state-default.json` to preserve existing data.

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
