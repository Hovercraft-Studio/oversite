# AppStore System

The AppStore is the core state management and messaging layer of Oversite. It provides:

- A **key/value store** shared across all connected clients
- A **pub/sub message bus** so components can react to state changes
- A **WebSocket distribution layer** (via `AppStoreDistributed`) so multiple machines or apps stay in sync
- **Unicast routing** so messages can be sent to a specific client by sender ID

## Key Files

| File | Role |
|---|---|
| `src/app-store/app-store-.mjs` | Base in-process AppStore (no networking) |
| `src/app-store/app-store-distributed.mjs` | Extends AppStore with WebSocket sync |
| `src/app-store/solid-socket.mjs` | Isomorphic WebSocket wrapper with auto-reconnect |
| `src/app-store/app-store-debug.mjs` | Debug helpers |
| `src/components/store/app-store-init.js` | Web component that boots AppStoreDistributed |

## Wire Format

Every AppStore message is a JSON object. At minimum it has a `key` and `value`:

```json
{
  "key": "some_data",
  "value": "Hello World",
  "store": true,
  "type": "string",
  "sender": "tablet_app",
  "receiver": "td_app",
  "sendonly": true
}
```

| Field | Required | Description |
|---|---|---|
| `key` | yes | The state key being set |
| `value` | yes | The value (any JSON-serializable type) |
| `store` | yes | Must be `true` for the server to store and relay as AppStore data |
| `type` | yes | `number`, `string`, `boolean`, `array`, `object` — required for strongly-typed receivers (e.g. Java). The server checks this alongside `store` before persisting. |
| `sender` | recommended | ID of the sending client — used for monitor display and heartbeat matching. Also set on the WS connection URL as `?sender=tablet` |
| `receiver` | no | If set, only the client with matching sender ID receives this message. Monitor clients always receive all messages regardless. |
| `sendonly` | no | If `true`, the server relays this to others but does NOT echo it back to the sender. Useful for high-frequency sensor data (e.g. Arduino) that doesn't need to receive its own messages. |

### Special Keys

- Keys containing `_health` — Boolean; the `app-store-health` component renders a colored status dot based on the value. The monitor highlights rows red when the value is `false` or `0`.
- Keys containing `_heartbeat` — Sent by `app-store-heartbeat.js` on a regular interval; value is milliseconds since app start. Convention: the key should be `{sender}_heartbeat` (e.g. if sender is `tablet`, use key `tablet_heartbeat`). The monitor matches heartbeat keys to sender IDs and shows special formatting; rows turn red if a heartbeat hasn't been seen for 20 seconds.

## AppStore (In-Process)

`AppStore` (base class, `app-store-.mjs`) is a synchronous, in-memory key/value store with event emission. In browser contexts, it sets `window._store` on construction and dispatches a `"appstore-ready"` event so components can wait for it safely.

```js
import AppStore from './src/app-store/app-store-.mjs';

const store = new AppStore();
store.set('volume', 0.8);        // local update only
store.get('volume');             // 0.8
```

### Listeners

Two listener patterns are supported:

```js
// 1. General listener — called for every key change
store.addListener(myObj);
// myObj must implement: storeUpdated(key, value)

// 2. Named-method listener — calls myObj[key](value) when that key changes
store.addListener(myObj, 'scene');
// myObj must implement: scene(value)
```

Remove listeners in cleanup:
```js
store.removeListener(myObj);
store.removeListener(myObj, 'scene');
```

### LocalStorage Persistence (Browser Only)

The base store can optionally persist its state to `localStorage`:

```js
store.initLocalStorage(['high_freq_key']); // pass keys to exclude from triggering saves
```

## AppStoreDistributed (WebSocket-Synced)

`AppStoreDistributed` extends the base store and opens a WebSocket connection **in the constructor** — there is no separate `connect()` call.

```js
import AppStoreDistributed from './src/app-store/app-store-distributed.mjs';

const store = new AppStoreDistributed(
  'ws://localhost:3003/ws', // WebSocket URL (channel + sender added as querystring)
  'my_app',                 // senderId (optional; defaults to "unknown_XXXX")
  'default',                // channelId (optional)
  'my_auth_key'             // authKey (optional)
);
// store is already connecting; use _store.addListener() to react
```

The constructor appends `?sender=X&channel=Y&auth=Z` to the URL automatically.

### The `set()` Method

`AppStoreDistributed.set()` takes an optional third `broadcast` argument:

```js
_store.set('scene', 'intro');         // local update only (no WS send)
_store.set('scene', 'intro', true);   // broadcast to server (bounce-back pattern)
_store.set('scene', 'intro', true, 'display_1');  // unicast to specific receiver
_store.set('sensor', 42, true, null, true);       // sendonly: server relays but doesn't echo back to this client
```

### Bounce-Back Sync Pattern

When broadcasting (`set(key, value, true)`):
1. The message is sent to the server **without** updating local state.
2. The server echoes it back to all clients on the channel (including the sender).
3. Local state updates only when the echo arrives via `onMessage()`.

This ensures all clients stay in sync with the server's view, even if the WebSocket is temporarily disconnected.

### Additional Methods

```js
store.getData('scene');       // returns the full last message object for a key, including sender
store.broadcastCustomJson({}); // send arbitrary JSON that's not AppStore-formatted
store.isConnected();          // boolean: is the WebSocket currently open?
```

### Special Store Events

`AppStoreDistributed` emits these keys on the local store (not sent to server):

| Key | When |
|---|---|
| `appstore_connected` | WebSocket connection opened; value = the WS URL |
| `appstore_disconnected` | WebSocket connection closed; value = the WS URL |
| `custom_json` | A non-AppStore JSON message was received; value = the parsed object |

Listen for them like any other key:
```js
_store.addListener(myObj, 'appstore_connected');
// myObj must implement: appstore_connected(value)
```

### Configuration via URL Hash

The `app-store-init` web component reads `#&wsURL=ws://...` from the page URL to configure the WebSocket connection at runtime without rebuilding.

```
https://my-installation.example.com/#&wsURL=ws://oversite.example.com/ws
```

## SolidSocket

`solid-socket.mjs` is an isomorphic WebSocket wrapper (works in both browser and Node.js). Key features:

- Auto-reconnects on disconnect
- Works with native `WebSocket` in browsers and the `ws` npm package in Node
- Exposes `setOpenCallback`, `setCloseCallback`, `setMessageCallback`

## Web Component: `app-store-init`

The `<app-store-init>` custom element bootstraps the AppStoreDistributed instance for a page:

1. Resolves the WS URL from `ws-url` attribute → `#&wsURL=` hash param → auto-detected from page host
2. Instantiates `AppStoreDistributed(wsURL, sender, channel, auth)` which immediately starts connecting
3. Fetches `/api/state/all` over HTTP to hydrate initial state (`init-keys` attribute controls which keys)
4. Sets `window._store` so all other components on the page share one store instance

Place it once per page (or use `<oversite-header>` which includes it):

```html
<app-store-init sender="tablet" init-keys="*"></app-store-init>
```

## AppStore REST API

The server exposes REST endpoints for interacting with the persistent state store. All routes are `GET`:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/state/all` | Returns the entire current state as JSON |
| `GET` | `/api/state/get/:key` | Returns the full stored message object for one key |
| `GET` | `/api/state/wipe/:key` | Removes a single key from the store |
| `GET` | `/api/state/wipe` | Wipes the entire state (use with caution) |

These endpoints are served by `src/server/persistent-state.mjs`.

## Persistent State

When a message has `store: true`, the server saves it to `_tmp_data/state/state.json`. This file is debounced — rapid updates only trigger one write. On startup, all clients receive the full persisted state when they connect, so they initialize to the current distributed state without any additional requests beyond what `app-store-init` already does.

**Note:** On cloud deployments (e.g., DigitalOcean App Platform), the `_tmp_data/` directory is ephemeral and is reset on each redeploy.

## Multi-Language Support

The AppStore wire format is language-agnostic JSON over WebSockets. Implementations exist for:

- JavaScript (this repo — browser + Node.js)
- TouchDesigner (Python, see `examples/app-store/touchdesigner/`)
- Java (external, used in production installations)
- Arduino/ESP32 (see `examples/app-store/arduino-esp32/`)
- Python (standalone client — planned; see [roadmap](./roadmap.md))

See [multi-language.md](./multi-language.md) for details on each.
