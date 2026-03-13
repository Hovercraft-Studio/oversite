# Multi-Language AppStore Clients

The AppStore wire format is JSON over WebSockets, making it straightforward to implement in any language. This document describes the known implementations and how to connect non-JavaScript clients.

## Protocol Summary

1. Open a WebSocket connection to `ws://host:3003/{channel}` (default channel: `default`)
2. Send and receive JSON messages in the [AppStore wire format](./app-store.md#wire-format)
3. To persist a value on the server, include `"store": true` in the message
4. To receive unicast messages, set your client's sender ID and listen for messages with `"receiver": "{your-id}"`
5. On connect, the server sends the full current state so clients can initialize

## Implementations

### JavaScript (Browser + Node.js)

**Primary implementation** — built into this repo.

- `src/app-store/app-store-.mjs` — base in-process store
- `src/app-store/app-store-distributed.mjs` — WebSocket-synced store
- `src/app-store/solid-socket.mjs` — isomorphic WS wrapper with auto-reconnect

Node.js example: `examples/app-store/nodejs/node-app-demo/index.mjs`

### TouchDesigner (Python)

TouchDesigner uses Python scripts to connect to the WebSocket server. The implementation lives in:

```
examples/app-store/touchdesigner/
├── tox/   — TouchDesigner component files
└── data/  — Supporting data files
```

The TD implementation:
- Uses Python's `websocket-client` library (or TD's built-in WebSocket DAT)
- Sends/receives the standard JSON wire format
- Typically sets `"sender": "touchdesigner"` for identification in the monitor

### Java

A standalone Java client library is used in production installations (external repo). It implements the same wire format and auto-reconnect behavior as SolidSocket.

Key behavior to match when building new Java clients:
- Connect to `ws://host:3003/default`
- Parse incoming JSON; update local state map on every message
- Use bounce-back pattern: send message to server first, update local state only on echo
- Send `"sender"` field with a unique app ID

### Arduino / ESP32

Minimal clients for microcontrollers that send sensor data to the AppStore.

```
examples/app-store/arduino-esp32/
├── accelerometer-demo/
│   └── accelerometer-demo.ino   — Sends accelerometer readings as AppStore messages
└── simple-sensor-demo/
    └── simple-sensor-demo.ino   — Generic sensor value sender
```

These sketches:
- Use the `ArduinoWebsockets` or `WebSocketsClient` library
- Connect to WiFi, then open a WebSocket to the Oversite server
- Send sensor values as AppStore messages on an interval

Example message from an accelerometer:
```json
{ "key": "accel_x", "value": 0.42, "type": "number", "sender": "esp32_sensor_1", "store": false }
```

Note: Arduino clients typically do **not** set `store: true` — they send high-frequency sensor data that doesn't need persistence.

### Python (Standalone)

A standalone Python AppStore client is **planned but not yet implemented**. When built, it should live at `examples/app-store/python/` and follow the same interface as the Node.js example.

Target interface:
```python
from app_store import AppStoreDistributed

store = AppStoreDistributed()
store.connect("ws://localhost:3003")
store.set("scene", "intro")
store.on("volume", lambda value: print(f"Volume: {value}"))
```

See [roadmap](./roadmap.md) for status.

### React (Frontend)

A React integration example is provided for teams that want to use React within an Oversite-connected page:

```
examples/react/
├── src/
│   ├── hooks/useAppStore.js   — Custom hook for AppStore
│   └── App.jsx
└── package.json
```

The `useAppStore` hook wraps the AppStore subscribe/unsubscribe pattern for React components.

### Unreal Engine

An Unreal Engine integration is in progress (external). It will use Unreal's built-in WebSocket support with the standard JSON wire format.

## Implementing a New Client

Any language with WebSocket support can implement an AppStore client. The minimum viable implementation:

1. **Connect** to `ws://host:3003/default`
2. **Receive** JSON messages and update a local key/value map
3. **Send** JSON messages when local state changes

For a complete client that matches the JS behavior:

4. **Bounce-back pattern**: Send to server → wait for echo → update local state (ensures consistency)
5. **Auto-reconnect**: Retry connection on disconnect (exponential backoff or fixed interval)
6. **State hydration**: On connect, receive the full state dump from the server and initialize local state from it
7. **Sender ID**: Set `"sender"` field so the monitor can identify your client

When contributing a new implementation, add it to `examples/app-store/{language}/` and update this document.
