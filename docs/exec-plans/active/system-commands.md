# System Commands — Execution Plan

Remote PC management via AppStore messages. Spec: [`docs/product-specs/system-commands.md`](../../product-specs/system-commands.md)

## Completed

- [x] **Core class** — `src/server/system-commands.mjs` with 5 built-in commands (`kill_process`, `restart_computer`, `send_keys`, `minimize_windows`, `list_processes`)
- [x] **Wire protocol** — individual key/value pairs per command (not JSON payloads), responses on `{key}_response`
- [x] **Response routing** — responses routed back to original sender via `receiverId` from `getData().sender`
- [x] **Custom command extensibility** — `addCommand(name, handler)` registers handler + listener in one call
- [x] **Standalone runner** — `examples/system-commands/index.mjs` with `--server`, `--channel`, `--sender`, `--auth` CLI args
- [x] **appStoreInit extended** — added `channelId` (4th param) and `authKey` (5th param), backward compatible
- [x] **app-store-button receiver** — new `receiver` attribute for unicast targeting
- [x] **oversite-header passthrough** — `channel` and `auth` attributes flow through to `<app-store-init>`
- [x] **minimize_windows generalized** — accepts pipe-separated patterns, defaults to `["teamviewer"]`
- [x] **PowerShell temp-file fix** — writes `.ps1` to `os.tmpdir()` to avoid here-string quoting issues
- [x] **Test UI** — `examples/dashboard/js-frontend/index.html` with command buttons on `dashboard` channel
- [x] **Spec doc** — `docs/product-specs/system-commands.md`
- [x] **Best practices doc** — data transmission section in `docs/product-specs/app-store.md`

## Completed (Additional)

- [x] **Receiver filtering** — `handleCommand()` checks `receiver` field against `senderId`; commands only execute when targeted (or broadcast with no receiver)
- [x] **Test UI restructured** — dashboard test UI now demonstrates broadcast vs targeted commands in separate cards
- [x] **server.mjs integration (optional)** — `--system-commands` flag / `SYSTEM_COMMANDS=true` env var starts an embedded SystemCommands client on the server's own machine. This is for the "server PC is also a target" scenario; the primary pattern is standalone client apps.

## Next Up

### N1 — npm module integration

Make it trivial to drop SystemCommands into any project via the `oversite` npm module. The `createSystemCommandsStandalone()` convenience function bundles WebSocket connection + command handlers + heartbeat for bare-machine deployments. For apps that already have an AppStoreDistributed instance, `new SystemCommands(appStore, senderId)` is the direct path.

**Files**: `src/server/system-commands.mjs`, `examples/oversite-module/backend/system-commands-standalone.mjs`

### N2 — Dashboard card management buttons

When a SystemCommands client is connected (detected via heartbeat), show management buttons (kill process, restart, send keys) on the Dashboard card for that PC.

**Files**: `src/components/dashboard/dashboard-view.js`, possibly new sub-component
**Depends on**: Heartbeat detection (no server-side dependency)

### N3 — Connection status indicator

Green dot / badge on Dashboard cards indicating a live SystemCommands connection for that machine. Derived from `{sender}_heartbeat` presence and freshness.

**Files**: `src/components/dashboard/dashboard-view.js`
**Depends on**: Heartbeat key convention already in place

### N4 — Process monitoring

Periodic process list reporting from SystemCommands clients. The Dashboard could detect stuck apps (process not found or CPU pegged) and surface a restart button.

**Files**: `src/server/system-commands.mjs`, dashboard components
**Depends on**: N2, N3

### N5 — Configurable command sets

Per-deployment allow-lists so each installation only exposes the commands it needs. Could be a constructor option or an environment variable.

**Files**: `src/server/system-commands.mjs`, `examples/system-commands/index.mjs`

## Key Files

| File | Role |
|---|---|
| `src/server/system-commands.mjs` | Core SystemCommands class |
| `examples/system-commands/index.mjs` | Standalone runner |
| `examples/dashboard/js-frontend/index.html` | Test UI with command buttons |
| `src/server/util.mjs` | `appStoreInit()` — extended with channel + auth |
| `src/components/ui/app-store-button.js` | Button with `receiver` attribute |
| `src/components/site/oversite-header.js` | Header with `channel`/`auth` passthrough |
| `docs/product-specs/system-commands.md` | Feature spec |
| `docs/product-specs/app-store.md` | Data transmission best practices |
