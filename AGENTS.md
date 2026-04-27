# Oversite — Agent Map

**One-liner**: Venue/installation operations toolkit — distributed state (AppStore + WebSockets), app health monitoring (Dashboard), and show-control web components.

## Quick Start

```bash
npm install
npm run dev        # Vite on :3002 + Express/WS on :3003
npm run build      # Vite → dist/
npm start          # Serve dist/ from :3003 (production)
```

See [`docs/COMMANDS.md`](docs/COMMANDS.md) for all commands.

## Key Directories

| Path | What lives here |
|---|---|
| `server.mjs` | Entry point — composes all server modules |
| `src/server/` | Backend modules (socket-server, dashboard-api, auth, alerts) |
| `src/app-store/` | AppStore base class + distributed WebSocket client |
| `src/components/` | Web components (27 total, all extend AppStoreElement) |
| `src/dashboard/` | DashboardPoster client utility |
| `src/util/` | Shared utilities |
| `app-store-demo/` | Starter demo app |
| `app-store-monitor/` | Live state inspection UI |
| `dashboard/` | Dashboard web UI |
| `examples/` | NodeJS, Electron, Arduino, TouchDesigner, React examples |
| `shared/css/` | PicoCSS + custom styles |
| `_tmp_data/` | Runtime data — gitignored, ephemeral on cloud |

## Hard Constraints

- **No TypeScript, React, Vue, Svelte, or Lit** — vanilla JS + Web Components only
- **No Shadow DOM** on new components (breaks global CSS)
- **No CSS class frameworks** — PicoCSS only (semantic/classless)
- **No server build step** — backend files run directly with Node
- **Node 22+**, ES Modules (`.mjs` for backend, `.js` for frontend)
- **Bounce-back pattern** — `_store.set(key, val, true)` sends to server first; local state updates only on echo

## Environment

```bash
NODE_ENV=development
VITE_FORCE_LOCAL_AUTH=true        # force auth even in dev
ALLOWED_WS_CHANNELS=default       # comma-separated channel names
AUTH_USERS=admin:password         # comma-separated user:pass pairs
ALERT_PROJECT_IDS=project-a       # projects that trigger Slack alerts
ALERT_SLACK_HOOK_URL=https://...  # Slack incoming webhook
SYSTEM_COMMANDS=true              # enable SystemCommands module (also: --system-commands flag)
```

## Doc Map

| Doc | Contents |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System diagram, data flow, module boundaries |
| [`docs/COMMANDS.md`](docs/COMMANDS.md) | All dev/build/deploy commands |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Design principles and philosophy |
| [`docs/FRONTEND.md`](docs/FRONTEND.md) | Web component architecture, AppStoreElement lifecycle |
| [`docs/BACKEND.md`](docs/BACKEND.md) | Server modules, data model, config |
| [`docs/PRODUCT_SENSE.md`](docs/PRODUCT_SENSE.md) | Users, value props, deployment contexts |
| [`docs/SLA.md`](docs/SLA.md) | SLA tier framework for ongoing installation support |
| [`docs/RELIABILITY.md`](docs/RELIABILITY.md) | Reconnect patterns, failure modes, offline handling |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Auth system, session handling, known gaps |

## Feature Specs

| Spec | Feature |
|---|---|
| [`docs/product-specs/app-store.md`](docs/product-specs/app-store.md) | AppStore: wire format, JS API, distributed sync |
| [`docs/product-specs/dashboard.md`](docs/product-specs/dashboard.md) | Dashboard: check-ins, screenshots, offline alerts |
| [`docs/product-specs/monitor.md`](docs/product-specs/monitor.md) | App Store Monitor: live state inspection |

## References

| Reference | Contents |
|---|---|
| [`docs/references/websocket-server.md`](docs/references/websocket-server.md) | WS server internals, channels, REST API |
| [`docs/references/web-components.md`](docs/references/web-components.md) | Component catalog, attributes, authoring guide |
| [`docs/references/multi-language.md`](docs/references/multi-language.md) | Non-JS clients: TD, Java, Arduino, Python |
| [`docs/references/deployment.md`](docs/references/deployment.md) | Local LAN, DigitalOcean, env vars, SSL |

## Active Work

| Plan | Status |
|---|---|
| [`docs/exec-plans/roadmap.md`](docs/exec-plans/roadmap.md) | Planned features and active backlog |
| [`docs/exec-plans/tech-debt-tracker.md`](docs/exec-plans/tech-debt-tracker.md) | Known issues, debt items, refactoring targets |
