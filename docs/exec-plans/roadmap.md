# Roadmap & Known Issues

This document tracks the active backlog, known bugs, planned features, and architectural decisions in progress. It supplements the root `TODO.md` with more context and priority framing.

For AI coding assistants: read this before starting any work to avoid duplicating effort or working against stated plans.

## Critical Issues (Fix These First)

### ~~R1 — Sync File I/O~~ ✅ DONE
Both `dashboard-api.mjs` and `persistent-state.mjs` have been migrated to `fs.promises` with async/await. No sync fs calls remain.

### R2 — Memory Leak in `app-store-table.js`
**File**: `src/components/monitor/app-store-table.js`
**Problem**: The monitor can consume multiple GB of RAM over hours/days. Likely cause: unbounded accumulation of event listeners and DOM nodes as state update events arrive.
**Fix**: Audit listener registration and DOM node creation; ensure proper cleanup in `disconnectedCallback`; consider a fixed-size ring buffer for the event table.
**Impact**: High — makes the monitor unusable for long-running sessions.

### R3 — Shared Config / ServerContext
**Files**: `src/server/socket-server.mjs`, `src/server/persistent-state.mjs`, `server.mjs`
**Problem**: Configuration (allowed channels, server options, etc.) is scattered across multiple files with no central config object.
**Fix**: Introduce a `ServerContext` class that holds server-wide config and is passed to modules on construction.
**Impact**: Low urgency but makes all other server-side work cleaner.

### R4 — `window._store` Usage Audit
**File**: `src/app-store/app-store-.mjs` and components
**Problem**: `window._store` is set as a global, which is fragile and hard to trace.
**Fix**: Audit all usages; consider a module-level singleton pattern instead of a window global.
**Impact**: Low urgency; relevant when adding tests or running Oversite as a module.

---

## Active Feature Work

### Channels: Per-Channel Persistent State
Currently all channels share one `state.json` file. Planned behavior:
- Each channel gets its own `_tmp_data/state/state-{channel}.json`
- `PersistentState` needs a `channelId` parameter
- `AppStoreMonitor` needs to support channel selection (dropdown to switch channels)
- Hydration endpoint (`/api/state/all`) needs a channel parameter

### ~~WebSocket-Based State Hydration~~ ✅ Done
Server sends full persisted state to each new client on connect via `SocketServer.sendStateToClient()` — one `persistent_state` message containing the full state map object, immediately after `client_connected` and `clients` broadcasts. `sendonly` clients are skipped.

`app-store-init` now listens for `persistent_state` via `_store.addListener(this, "persistent_state")` and hydrates from it, replacing the previous HTTP fetch. The HTTP endpoint (`/api/state/all`) remains available as a fallback for non-WebSocket contexts.

### Dashboard ↔ AppStore Integration
Planned: allow apps to post dashboard check-ins via AppStore messages (`receiver: "dashboard"`) instead of a separate HTTP POST. This would:
- Unify the two systems for apps already connected to AppStore
- Enable real-time connection/disconnection status on the dashboard
- Require `DashboardApi` to listen on the WebSocket server for incoming check-in messages

### System Commands (Remote PC Management)
Core module complete — `SystemCommands` class with 5 built-in commands, standalone runner, custom command extensibility, and a web UI for triggering commands. Next steps: wire into `server.mjs`, add Dashboard card management buttons, connection status indicators, and process monitoring.

See [active/system-commands.md](active/system-commands.md) for the full execution plan.

### Rooms
A higher-level concept above channels:
- Rooms are auto-created on demand with a server-known auth key
- Each room has its own persistent state
- Rooms auto-recycle after a configurable number of days
- Modeled after the "Connected Canvas" rooms concept

### Python AppStore Client
A standalone Python client library (`examples/app-store/python/`) matching the JS interface. Target API:
```python
store = AppStoreDistributed()
store.connect("ws://localhost:3003")
store.set("scene", "intro")
store.on("volume", lambda v: print(v))
```

### SSL / HTTPS for Local Tablets
iPad and some Android browsers require `wss://` even on LAN. Options being evaluated:
- `devcert` or `selfsigned` npm packages for local self-signed certs
- Vite SSL plugin + proxy
- Documented workaround: use cloud deployment and connect over internet

Current state: unsolved. See SSL section in `TODO.md` for research notes.

---

## UI / Component Work

### `disconnectedCallback` Cleanup
All web components should properly clean up event listeners and DOM references in `disconnectedCallback`. This is partially done but not audited across all components.

### `dashboard-view.js` Decomposition
`src/components/dashboard/dashboard-view.js` is ~640 lines and handles too much. Should be split into smaller focused components.

### New UI Controls
- **Volume knob** (port from haxlib project)
- **X/Y pad** — 2D position control
- **Brightness control**
- Consider: what other show-control-specific controls are commonly needed?

### AppStore Demo Updates
- Break the demo into accordion sections by control type
- Add a form to broadcast arbitrary test key/value messages (useful for testing new receivers)

### Monitor Improvements
- Channel selector dropdown (switch between channels without changing URL)
- Client list rebuilt via WebSocket instead of HTTP polling
- Filter event log by sender/client
- Click to resend a message from the event log
- "Expected clients" list with red row for missing clients
- Client last-message timestamp

---

## Dashboard Improvements

- Resize screenshots before upload if too large (use `canvas` npm package)
- Auth for posting check-ins (currently unprotected — any POST is accepted)
- Per-project log history (session/user counts, health check history)
- Multiple dashboard "views" with filtered project lists (e.g., client-facing vs internal)
- Backend service pings (is Convex up? is the database reachable?)
- Slack/ZohoDesk ticketing integration

---

## Auth Improvements

- WebSocket auth: verify `AUTH_USERS` on WS connect (via querystring or header)
- Session tokens (replace username:password basic auth)
- Optional redirect attribute on `<auth-form>` after successful login

---

## Testing

No automated tests currently exist. When adding tests:
- Each core module should be testable in isolation
- Integration tests should cover: localhost, IP address, http/https, ws/wss, production server
- Avoid mocking the WebSocket server — test against a real running instance

---

## Nice-to-Haves / Ideas

- **Local task monitor**: a Node app that watches local processes, reports to dashboard, and can restart stuck tasks (using `fkill`)
- **Admin page**: show-specific list of AppStore commands (key/value presets) for operators
- **AppStore via HTTP POST**: allow setting a key via `POST /api/state` for integrations that can't open WebSockets
- **Java client updates**: add `receiver` field support; add `ws?sender=` querystring param
- **PlusSix-style demo**: temporary rooms for multi-user web interactions
- **Figma cursor demo**: each client has a tracked mouse cursor visible to others
- **Multi-browser slideshow demo**
- **PONG demo**: game logic running on the server via AppStore

---

## Done (Recent)

- Server Dashboard API migrated to Promises (`server.mjs`)
- Web components big refactor
- npm package updates
- DigitalOcean App Platform deployment working
- `.env` file replaces `config.json`
- Java client: `sender` field added
