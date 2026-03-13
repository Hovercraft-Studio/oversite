# WebSocket Server

The WebSocket server is the backbone of the Oversite distributed state system. It relays AppStore messages between all connected clients, manages channels, and coordinates persistence.

## Key Files

| File | Role |
|---|---|
| `src/server/socket-server.mjs` | WebSocket server: client lifecycle, message relay, channel management |
| `src/server/persistent-state.mjs` | Persists `store: true` messages to disk; exposes REST endpoints |
| `src/app-store/solid-socket.mjs` | Client-side WebSocket wrapper (auto-reconnect, isomorphic) |

## Architecture

```
Browser / Node client
       |
  SolidSocket (auto-reconnect WS)
       |
  [WebSocket Server - socket-server.mjs]
       |
  ┌────┴───────────────────────────────────┐
  │  Channel routing                       │
  │  Message relay to all clients          │
  │  Server heartbeat (30s AppStore msg)   │
  └────┬───────────────────────────────────┘
       |
  persistent-state.mjs   ← listens directly on wsServer
       |
  _tmp_data/state/state.json
```

## WebSocket URL Format

The server listens at path `/ws`. Channel and sender are **querystring parameters**, not URL path segments:

```
ws://localhost:3003/ws?sender=tablet&channel=default
ws://localhost:3003/ws?sender=sensor_1&channel=lights&sendonly=true
wss://your-app.ondigitalocean.app/ws?sender=tablet&channel=default
```

| Querystring Param | Description |
|---|---|
| `sender` | Identifies this client in the monitor and in outgoing messages. Defaults to `"unknown"`. |
| `channel` | Which channel to join. Defaults to `"default"`. |
| `sendonly` | If `true`, this client sends messages but never receives any. Used for high-frequency sensor devices. |
| `auth` | Auth key (not yet enforced — planned). |

## SocketServer (`socket-server.mjs`)

Responsibilities:
- Accepts WebSocket connections from clients
- Parses querystring params (`sender`, `channel`, `sendonly`) from the connection URL
- Routes clients to channels; creates a channel if it doesn't exist, deletes it when empty
- Relays each incoming message to all other clients on the same channel (broadcast) or to a specific client (unicast via `receiver` field)
- Broadcasts a server heartbeat every 30 seconds
- Broadcasts `client_connected` and `client_disconnected` AppStore messages to the channel on every join/leave
- Exposes REST endpoints for channel and client info

### Channels

Channels allow multiple isolated AppStore namespaces to share one server. Each channel has its own set of connected clients and message stream.

- The default channel is `default`
- Allowed channels are configured via `ALLOWED_WS_CHANNELS` in `.env`
- A channel is auto-created on first connection and auto-deleted when the last client leaves
- If a client attempts to join a channel not in the allowed list, the connection is rejected (close code 1008)

```bash
ALLOWED_WS_CHANNELS=default,lights,audio
```

### Server Heartbeat

Every 30 seconds the server broadcasts an AppStore-format message to **all channels**:

```json
{ "key": "💓", "value": "💓", "store": true, "type": "string", "sender": "server" }
```

This is not a WebSocket ping/pong frame — it's a regular AppStore message that keeps certain WS client implementations alive.

### Client Connect/Disconnect Events

When a client joins or leaves a channel, the server broadcasts two messages to all remaining clients:

1. An AppStore message with `key: "client_connected"` or `key: "client_disconnected"`, value = the sender ID
2. An updated `clients` array (key: `"clients"`) with the current connected client list for that channel

### Unicast Routing

If a message has a `receiver` field, it is delivered only to the client whose `sender` matches that value.

**Exception**: Clients with `sender: "monitor"` always receive all messages, including unicast ones — so the monitor UI can observe all traffic.

```json
{
  "key": "command",
  "value": "reset",
  "store": true,
  "type": "string",
  "sender": "controller",
  "receiver": "display_1"
}
```

### `sendonly` Clients

Clients connecting with `?sendonly=true` never receive any messages (not even the server heartbeat). Useful for:
- High-frequency sensor devices (Arduino, ESP32) that only push data and don't need to consume it
- Reducing bandwidth on constrained devices

### Client Lifecycle

1. Client connects → querystring parsed, added to channel
2. Channel created if it doesn't exist (and is in the allowed list)
3. Server broadcasts `client_connected` + updated `clients` list to channel
4. Server sends full persisted state to the new client (`sendStateToClient`) — one message per key, skipped for `sendonly` clients
5. Client sends messages → relayed to channel peers (respecting `sendonly`, `receiver`, unicast rules)
6. Client disconnects → removed from channel; server broadcasts `client_disconnected` + updated `clients` list
7. Channel auto-deleted if it becomes empty

### REST Endpoints (socket-server)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/state/channels` | Lists all active channels and their connected clients |
| `GET` | `/api/state/clients` | Lists all connected clients across all channels |
| `GET` | `/api/state/clients/:id` | Lists clients in a specific channel |

## Persistent State (`persistent-state.mjs`)

Runs alongside `SocketServer` and listens directly on the WebSocket server for any message that has `store: true`. When received:

1. Stores the full message object (including `sender`, `time`, etc.) in an in-memory map keyed by `key`
2. Writes the map to `_tmp_data/state/state.json` — rate-limited to once per second

On server startup, the file is loaded so state survives server restarts.

### REST Endpoints (persistent-state)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/state/all` | Full current state as JSON (entire message object per key) |
| `GET` | `/api/state/get/:key` | Returns the full stored message object for one key |
| `GET` | `/api/state/wipe/:key` | Removes a single key and saves to disk |
| `GET` | `/api/state/wipe` | Wipes the entire state (use with caution) |

### State File Location

`_tmp_data/state/state.json` — gitignored. On cloud platforms with ephemeral filesystems (DigitalOcean App Platform), this file does not survive redeploys.

## Legacy: Bare WebSocket Relay (`ws-relay.mjs`)

`src/server/ws-relay.mjs` is a minimal WebSocket relay with no channel logic or persistence. For reference and legacy use only. Prefer `socket-server.mjs` for all new work.

Run with: `npm run ws` (does not start Express or dashboard APIs).

## Connecting a Client

**Browser (using `app-store-init` web component):**
```html
<app-store-init sender="tablet" channel="default" init-keys="*"></app-store-init>
```

**Node.js:**
```js
import AppStoreDistributed from 'oversite/src/app-store/app-store-distributed.mjs';
// Connection established in constructor — no separate connect() call
const store = new AppStoreDistributed('ws://localhost:3003/ws', 'my_node_app', 'default');
```

**Direct WebSocket (other languages):**
Connect to `ws://host:3003/ws?sender=my_app&channel=default`. Send and receive JSON messages in the [AppStore wire format](./app-store.md#wire-format).

## Known Issues & Planned Work

- **Channels with per-channel persistence**: All channels share one state file. Planned: separate `state-{channel}.json` per channel, plus channel param on REST endpoints.
- **WebSocket-based hydration**: ✅ Done. Server sends `persistent_state` message on connect; `app-store-init` listens and hydrates from it. HTTP endpoint remains as a fallback.
- **WebSocket auth**: `auth` querystring param is parsed but not yet enforced. See [roadmap](./roadmap.md).
- **Rooms**: A higher-level concept (auto-recycled, auth-gated namespaces) is planned on top of channels. See [roadmap](./roadmap.md).
