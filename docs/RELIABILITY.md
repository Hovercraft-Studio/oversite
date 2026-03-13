# Reliability

Oversite is designed to run unattended for months at physical installations. Reliability patterns are built into the core systems.

## WebSocket Auto-Reconnect (SolidSocket)

`src/app-store/solid-socket.mjs` wraps WebSocket with automatic reconnection in both browser and Node.js.

- If the connection drops, SolidSocket retries automatically
- No manual reconnect logic needed in application code
- Used by `AppStoreDistributed` — all AppStore clients get this for free
- `isConnected()` returns current connection state

## Bounce-Back Sync

The bounce-back pattern ensures client state stays consistent with the server even across reconnects.

- Client sends `set(key, value, true)` → sends to server, does NOT update local state
- Server echoes message back to all channel clients
- Client updates local state only on receiving the echo
- If the connection was down during the send, the update is lost — but when reconnection happens, `app-store-init` re-hydrates from `/api/state/all`

**Consequence**: never call `_store.set(key, val, true)` and immediately read the value back — it won't be there yet. Listen for the store update instead.

## State Persistence

AppStore state survives server restarts (but not redeploys on cloud):

- `PersistentState` writes `store: true` messages to `_tmp_data/state/state.json`
- Rate-limited to 1 write/second to avoid disk thrash
- On startup, state is loaded from file and new clients receive it via HTTP hydration

Dashboard check-ins also persist to `_tmp_data/dashboard/projects.json` and survive server restarts.

## Server Heartbeat

The WebSocket server broadcasts an AppStore message every 30 seconds:
```json
{ "key": "💓", "value": "💓", "store": true, "type": "string", "sender": "server" }
```
This keeps certain WebSocket client implementations (especially Java and native apps) from closing idle connections.

## Client Heartbeats

Apps should send a heartbeat to show they're alive. Convention:
- Use `<app-store-heartbeat key="{sender}_heartbeat" interval="30000">`
- Value = milliseconds since app start
- The monitor highlights heartbeat rows red after 20 seconds without an update

## Dashboard Offline Alerts

`OfflineAlerts` (`src/server/offline-alerts.mjs`) provides active monitoring:

- Polls dashboard data every **60 seconds**
- Fires a Slack webhook when a project hasn't checked in for **>20 minutes**
- Also fires a recovery alert when the project checks in again
- Only monitors project IDs listed in `ALERT_PROJECT_IDS`

## Known Failure Modes

| Failure | Behavior | Mitigation |
|---|---|---|
| Server restart | Clients reconnect via SolidSocket; state rehydrated from file | Automatic |
| Server redeploy (cloud) | `_tmp_data/` wiped; clients reconnect but get empty state | Accepted tradeoff — see roadmap |
| Client disconnect | Removed from channel; `client_disconnected` broadcast to peers | Automatic |
| Stale persistent state | Old keys accumulate in `state.json` | Use `/api/state/wipe/:key` or `/api/state/wipe` |
| Monitor memory leak | `app-store-table` accumulates listeners/DOM over hours | Refresh monitor page periodically (see [tech-debt-tracker](exec-plans/tech-debt-tracker.md)) |
| Dashboard image disk full | Old images pruned when history exceeds 100 entries per project | Automatic |

## What Is Not Handled

- No circuit breaker for downstream services
- No retry queue for failed Dashboard check-ins
- No message delivery guarantee on WebSocket (fire-and-forget)
- No deduplication of messages
