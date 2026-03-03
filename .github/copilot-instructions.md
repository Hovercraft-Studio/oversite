# Oversite — Copilot Instructions

Oversite is a **venue/installation operations toolkit** built by Hovercraft Studio. It is designed to hold up for many years in production at physical interactive installations (museums, exhibits, venues). The explicit priority is **longevity and simplicity over framework adoption** — do not suggest React, Vue, TypeScript, or any heavy abstraction unless explicitly asked.

## What Oversite Does

Three integrated systems, all running from one Node.js server:

1. **AppStore** — a shared key/value state & pub/sub event system. Works in-process or across machines via WebSockets. Used to glue together TouchDesigner, Java apps, browser UIs (iPads as show controllers), Unity, and Arduino devices.
2. **Dashboard** — an uptime/health monitor. Remote apps POST check-ins; the server persists them; Slack webhooks fire when an app goes offline for > 20 minutes.
3. **AppStore Monitor** — a browser UI for live-inspecting all AppStore keys, connected clients, and events.

**Typical deployment**: A venue has a TouchDesigner server, a Java exhibit controller, and iPads as show controllers. All three connect to the Oversite WebSocket server, share state through AppStore, and report health through Dashboard. The server may run on DigitalOcean App Platform or on a local machine.

## Ports & URLs

- `localhost:3002` — Vite dev server (dev only)
- `localhost:3003` — Express HTTP API + static file server (production) + WebSocket server
- `ws://localhost:3003/ws?sender=tablet&channel=default` — WebSocket connection URL

## Technology Stack

| Layer | Tech |
|---|---|
| Backend runtime | Node.js ≥ 22, ES Modules (`.mjs`) |
| HTTP server | Express 5 |
| WebSocket server | `ws` npm package |
| Frontend | **Vanilla JS, Web Components (Custom Elements), no framework** |
| Styling | **PicoCSS** (classless/semantic — do not add CSS class-based frameworks) |
| Build/dev | **Vite 7** (multi-entry; only for frontend — server runs directly with Node) |
| Notifications | `notyf` |
| Reconnecting sockets | Custom `SolidSocket` class (isomorphic: works in browser and Node) |
| Env config | `dotenv` |
| Process dev | `nodemon` + `concurrently` |

**Hard constraints:**
- No TypeScript
- No React / Vue / Svelte
- No Shadow DOM except where already in use (`app-store-init`, `dashboard-view`)
- No build step for server code — server files run directly with Node
- Frontend `.js` extensions for components; backend `.mjs` extensions for server modules

## Architecture Map

### Server entry (`server.mjs`)
Boots config from CLI args + `.env`, then composes four modules:
- `AuthApi` — stateless username+password auth (`POST /api/auth`)
- `SocketServer` — multi-channel WebSocket relay, heartbeat, client lifecycle
- `DashboardApi` — file-backed JSON store for project check-ins, image uploads, REST CRUD
- `OfflineAlerts` — polls `DashboardApi` data on an interval; fires Slack when a project's last check-in is > 20 min old

### `/src/server/` — ownership by file
| File | Responsibility |
|---|---|
| `socket-server.mjs` | Channel management, message relay (unicast/broadcast), `client_connected`/`client_disconnected` events, 30s heartbeat |
| `persistent-state.mjs` | Listens to WS messages with `store: true`; writes to `_tmp_data/state/state.json` (debounced); REST endpoints for reading/wiping state |
| `dashboard-api.mjs` | REST CRUD for project check-ins + image uploads; uses **synchronous** `fs.readFileSync`/`writeFileSync` (known inconsistency vs `persistent-state.mjs`) |
| `offline-alerts.mjs` | Slack webhook notifications for stale projects |
| `auth-api.mjs` | Username+password check against `.env` `AUTH_USERS` |
| `ws-relay.mjs` | Legacy bare websocket relay — do not extend, kept for reference only |
| `util.mjs` | `logBlue`, `logGreen`, `logMagenta`, `logCyan`, `logRed`, `ipAddr`, `getCliArg` |

**Always use `util.mjs` logging functions in server code — never raw `console.log`.**

### `/src/app-store/` — AppStore classes
| File | Responsibility |
|---|---|
| `app-store-.mjs` | Base in-process pub/sub key/value store; sets `window._store` global singleton |
| `app-store-distributed.mjs` | Extends `AppStore`; adds `SolidSocket` WS connection; "bounce-back" sync pattern |
| `solid-socket.mjs` | Isomorphic auto-reconnecting WebSocket wrapper |
| `app-store-debug.mjs` | Debug overlay helpers |

**Critical pattern — bounce-back sync**: `AppStoreDistributed.set(key, value, broadcast=true)` sends to server WITHOUT updating local state. Local state only updates when the message bounces back from the server. This keeps all peers in sync even when a connection drops mid-send. Do not break this pattern.

### `/src/components/` — Web Components
All components extend `AppStoreElement` from `app-store-element.js`.

`AppStoreElement` lifecycle:
1. `connectedCallback` reads `key`/`value` attributes, waits for `window._store` via `ObjectUtil.callbackWhenPropertyExists`
2. `initStoreListener()` subscribes to the store
3. `storeUpdated(key, value)` called on every store update — subclasses override this
4. `render()` injects `<style>` from `css()` + HTML from `html()`

Key components:
- `app-store-init` — boots `AppStoreDistributed`, hydrates from `/api/state/all`, parses `#&wsURL=...` hash param for remote WS redirection
- `app-store-button` — button with `toggle` and `momentary` modes
- `app-store-table` — live table of all keys/values (**known memory leak**: likely unbounded listener/DOM accumulation)
- `dashboard-view` — full dashboard UI, ~640 lines (polling, hash-based routing, detail views) — candidate for decomposition
- `oversite-header` — per-page header for Oversite demo pages that auto-boots `app-store-init` + heartbeat + auth

All components registered in `_register-components.js`. Each file calls its own `MyComponent.register()` at the bottom.

## AppStore JSON Wire Format

```json
{
  "key": "some_data",
  "value": "Hello World",
  "store": true,
  "type": "number|string|boolean|array|object",
  "sender": "tablet_app",
  "receiver": "td_app"
}
```

- `key` and `value` — required
- `store: true` — required; flags this as an AppStore message
- `type` — required; helps strongly-typed clients (Java, etc.) parse the value correctly
- `sender` — optional but strongly recommended; used in Monitor UI and heartbeat matching
- `receiver` — optional; unicast routing — only that client gets the message
- Keys must be `snake_case` (lowercase, underscores)
- Heartbeat keys follow convention: `{sender}_heartbeat` (e.g., `tablet_heartbeat`), value in milliseconds since app start
- Health keys follow convention: `{thing}_health`, value `true`/`false`/`0`/`1`

## Code Conventions

### Formatting
- 2-space indentation, semicolons, double quotes (Prettier-compatible)
- Kebab-case filenames: `app-store-button.js`, `socket-server.mjs`

### Section comments
```javascript
/////////////////////////////////////////////////////////
// Section Name
/////////////////////////////////////////////////////////
```

### Backend class pattern
```javascript
import { logGreen } from "./util.mjs";

class MyServerModule {
  constructor(app, config) {
    this.app = app;
    this.config = config;
    this.handleRequest = this.handleRequest.bind(this); // bind all callbacks
  }
  addRoutes() { ... }
  handleRequest(req, res) {
    logGreen("Request received");
    res.json({ success: true });
  }
}
```

### Frontend component pattern
```javascript
import AppStoreElement from "./app-store-element.js";

class MyComponent extends AppStoreElement {
  static observedAttributes = ["my-attr"];
  initStoreListener() { super.initStoreListener(); }
  storeUpdated(key, value) {
    if (key !== this.storeKey) return;
    this.setStoreValue(value);
  }
  setStoreValue(value) {
    const el = this.el.querySelector(".display");
    if (el) el.textContent = value;
  }
  css() { return /*css*/`:host { display: block; }`; }
  html() { return /*html*/`<div class="display"></div>`; }
  static register() { customElements.define("my-component", MyComponent); }
}
MyComponent.register();
export default MyComponent;
```

- Use `/*html*/` and `/*css*/` tagged template comments for editor syntax highlighting
- No Shadow DOM unless already present in that component
- `this.el` is the element reference (= `this` in most components)

## Environment Configuration (`.env`)

```bash
NODE_ENV=development
VITE_FORCE_LOCAL_AUTH=false
ALLOWED_WS_CHANNELS=default,channel2    # comma-separated whitelist
AUTH_USERS=admin:password,user2:pass2   # comma-separated user:pass pairs
ALERT_PROJECT_IDS=project-a,project-b  # projects to monitor for offline alerts
ALERT_SLACK_HOOK_URL=https://...        # Slack incoming webhook URL
```

Unknown channel IDs are rejected at WS connection time with close code 1008.

## Active Known Issues (do not regress these)

1. **`app-store-table` memory leak** — can consume multiple GB of RAM over long-running installs. Likely unbounded listener and/or DOM node accumulation. Fix requires auditing `disconnectedCallback` cleanup.
2. **Synchronous file I/O in `dashboard-api.mjs`** — uses `fs.readFileSync`/`writeFileSync`. Should be migrated to `fs.promises` to match `persistent-state.mjs`.
3. **Channel-unaware persistent state** — `PersistentState` stores all channels in one file. Needs per-channel state files.
4. **`app-store-.mjs` filename** — trailing dash is a placeholder; the correct rename target is `app-store.mjs`.

## Standing Work Areas (from TODO.md)

- **OOP refactor** — move toward a `ServerContext` class to hold shared config/state
- **Rooms concept** — per-channel persistent state files, recycled after N days, creation requires auth
- **Dashboard ↔ AppStore integration** — accept check-ins via `receiver="dashboard"` WS messages
- **Auth upgrade** — WS auth via querystring/headers; session/token system
- **SSL for tablets** — unsolved; webcam + iPad + mixed ws/https is an open problem
- **Hydration via WebSocket** — replace HTTP hydration endpoint with WS-based delivery
- **Test suite** — no tests exist; needed across localhost, IP, http/https, ws/wss, production
- **Language clients** — Python client missing; Unreal WIP; Java needs `receiver` + `ws?sender=` querystring

## Deployment

Production runs on **DigitalOcean App Platform**. Build: `npm run build`. Run: `npm start`. Static frontend is served from `/dist` by Express (port injected via `process.env.PORT`). Temp data paths are rerouted in `server.mjs` for production. File-backed state does NOT survive ephemeral restarts on DO.

## Using Oversite as an npm Module

Other projects install Oversite via `npm install oversite`. Components and utilities are imported directly from the package path (e.g., `import "oversite/src/components/_register-components.js"`).
