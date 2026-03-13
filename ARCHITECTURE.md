# Architecture

## System Context

Oversite is a single Node.js server that provides three integrated systems to a network of client apps (browsers, Node processes, Java, TouchDesigner, Arduino).

```
                        ┌─────────────────────────────────────┐
                        │           Oversite Server           │
                        │  (Express + WebSocket, port 3003)   │
                        │                                     │
  Clients               │  ┌─────────────┐  ┌─────────────┐  │
  ────────              │  │ SocketServer│  │  Dashboard  │  │
  Browsers    ←─ WS ──► │  │  + Persist  │  │    API      │  │
  Node apps   ←─ HTTP ─►│  │   State     │  │             │  │
  Java apps             │  └──────┬──────┘  └──────┬──────┘  │
  TouchDesigner         │         │                │         │
  Arduino               │  ┌──────▼──────┐  ┌──────▼──────┐  │
                        │  │_tmp_data/   │  │_tmp_data/   │  │
                        │  │state/       │  │dashboard/   │  │
                        │  │state.json   │  │projects.json│  │
                        │  └─────────────┘  └─────────────┘  │
                        │                                     │
                        │  ┌─────────────┐  ┌─────────────┐  │
                        │  │  Auth API   │  │  Offline    │  │
                        │  │             │  │  Alerts     │  │
                        │  └─────────────┘  └─────────────┘  │
                        └─────────────────────────────────────┘
                                      │
                                 Slack webhook
```

## Three Systems

### 1. AppStore + WebSocket Server

Distributed key/value state and pub/sub messaging. Clients share state across machines, languages, and processes in real time.

- **Wire protocol**: JSON over WebSocket (`ws://host:3003/ws?sender=X&channel=Y`)
- **Bounce-back sync**: clients send to server → server echoes to all channel members → clients update locally on receipt. Never update local state before the echo.
- **Persistence**: messages with `store: true` are saved to `_tmp_data/state/state.json` (rate-limited to 1 write/sec)
- **Channels**: isolated namespaces on one server; configured via `ALLOWED_WS_CHANNELS`

### 2. Dashboard

Health monitoring for deployed apps. Apps POST periodic check-ins; operators view status in the web UI.

- **Transport**: HTTP POST to `/api/dashboard` (JSON body with `appId` required)
- **Storage**: `_tmp_data/dashboard/projects.json` + image files in `_tmp_data/dashboard/images/`
- **History**: 100 check-ins per project; oldest pruned automatically
- **Alerts**: `OfflineAlerts` polls every 60s, fires Slack webhook at 20-min offline threshold

### 3. Web Components + Show Control UI

A library of AppStore-wired UI components for building show controllers and visitor-facing interfaces. No framework — vanilla Custom Elements.

- **Base class**: `AppStoreElement` — handles store subscription lifecycle, `html()`/`css()`/`render()` pattern
- **Styling**: PicoCSS (semantic, classless) — no Bootstrap, Tailwind, etc.
- **Entry point**: `<oversite-header id="sender-id">` sets up store, heartbeat, auth in one tag

## End-to-End Flow: AppStore Message

```
1. User clicks <app-store-button key="app_state" value="attract">
2. AppStoreButton calls _store.set("app_state", "attract", true)
3. AppStoreDistributed.set() builds JSON: { key, value, store:true, type, sender }
4. SolidSocket sends JSON to ws://host:3003/ws
5. SocketServer.handleMessage() parses receiver field
6. SocketServer.broadcastMessage() relays to all channel clients
7. PersistentState.listenToWsServer() sees store:true → saves to state.json
8. All clients receive the echo via onMessage()
9. Each AppStoreDistributed updates local state map
10. Each AppStoreElement.storeUpdated() fires → DOM updates
```

## End-to-End Flow: Dashboard Check-in

```
1. DashboardPoster interval fires (default: 10 minutes)
2. Builds checkinData: { appId, appTitle, uptime, resolution, frameRate, ... }
3. Optionally includes base64 image (imageScreenshot or imageExtra)
4. POST to /api/dashboard with JSON body
5. DashboardApi.processCheckIn() → saves images to disk, merges data, writes projects.json
6. Dashboard web UI polls /api/dashboard/json → renders updated cards
7. OfflineAlerts polls in-memory data → fires Slack if project stale >20min
```

## Domain Boundaries

| Module | File | Owns |
|---|---|---|
| HTTP + WS server bootstrap | `server.mjs` | Port binding, config assembly, module composition |
| WebSocket relay + channels | `src/server/socket-server.mjs` | Client lifecycle, channel routing, message relay |
| State persistence | `src/server/persistent-state.mjs` | `store:true` messages → disk; `/api/state/*` routes |
| Dashboard ingestion | `src/server/dashboard-api.mjs` | Check-in POST, image storage, projects.json |
| Offline alerts | `src/server/offline-alerts.mjs` | Polling, Slack webhook |
| Auth | `src/server/auth-api.mjs` | Login/logout, session cookies, `.env` AUTH_USERS |
| AppStore (in-process) | `src/app-store/app-store-.mjs` | Local key/value, listeners, localStorage opt-in |
| AppStore (distributed) | `src/app-store/app-store-distributed.mjs` | WS connection (in constructor), bounce-back set() |
| WS wrapper | `src/app-store/solid-socket.mjs` | Auto-reconnect, isomorphic (browser + Node) |
| Dashboard poster | `src/dashboard/dashboard-poster.mjs` | HTTP POST client, screenshot capture |
| Web components | `src/components/` | UI, store connection, monitor, auth, site chrome |

## Key Architectural Decisions

1. **Vanilla JS + Web Components** over React/Vue — longevity for multi-year installations; no dependency churn. See [`docs/design-docs/core-beliefs.md`](docs/design-docs/core-beliefs.md).
2. **Bounce-back sync** — all AppStore clients update only on server echo, never optimistically. Prevents divergence when WS reconnects.
3. **Single server process** — Express + WebSocket share one port in production; no microservices.
4. **Ephemeral file storage** — `_tmp_data/` works on disk locally and cloud, but resets on redeploy. Accepted tradeoff for simplicity.
5. **No Shadow DOM** (except `app-store-init`) — global CSS must apply to all components without `::part()`.

## Directory Map

```
oversite/
├── server.mjs                  ← entry point
├── vite.config.js              ← multi-entry Vite build
├── AGENTS.md                   ← agent map (start here)
├── ARCHITECTURE.md             ← this file
├── src/
│   ├── server/                 ← backend modules
│   ├── app-store/              ← AppStore core
│   ├── components/             ← web components
│   │   ├── ui/                 ← controls (button, slider, etc.)
│   │   ├── store/              ← connection bootstrap (app-store-init)
│   │   ├── monitor/            ← live state inspection components
│   │   ├── auth/               ← login/auth gate
│   │   ├── dashboard/          ← dashboard view component
│   │   └── site/               ← page chrome (oversite-header)
│   ├── dashboard/              ← DashboardPoster client
│   └── util/                   ← shared utilities
├── app-store-demo/             ← canonical component usage example
├── app-store-monitor/          ← live debugging UI
├── dashboard/                  ← dashboard web UI
├── shared/css/                 ← PicoCSS + custom styles
├── examples/                   ← integration examples
└── docs/                       ← full doc tree (see AGENTS.md)
```
