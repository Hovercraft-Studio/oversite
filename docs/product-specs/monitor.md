# App Store Monitor

The App Store Monitor is a local debugging tool for inspecting the live state of a running Oversite installation. It shows all connected clients, the full key/value state, and a real-time stream of incoming AppStore messages.

## Location

```
app-store-monitor/
├── index.html   — Monitor page
└── js/
    └── app.js   — Monitor application logic
```

Served at `/app-store-monitor/` when the Oversite server is running.

## What It Shows

The monitor has three main panels:

### 1. Connected Clients

Uses `<app-store-clients>` to display all clients currently connected to the WebSocket server. Each client shows:
- Its sender ID (if set)
- Connection status
- Whether it matches a known heartbeat source

### 2. State Table

Uses `<app-store-table>` to show every key currently in the store with its current value. Features:
- Live updates as values change
- Health indicator rows (keys matching `_health` are highlighted red when `false`)
- Ability to clear individual keys
- Filter/search keys by name

### 3. Event Log

Uses `<app-store-event-table>` and `<event-log-view>` to show the incoming stream of AppStore messages in real time. Useful for:
- Watching which client is sending what
- Verifying message routing (unicast vs. broadcast)
- Checking message format and timing

## Usage

1. Start the Oversite server (`npm run dev` or `npm start`)
2. Open `http://localhost:3002/app-store-monitor/` in a browser
3. The monitor connects to the local WebSocket server automatically

The monitor requires the **full Oversite server** (`server.mjs`) — it does not work with the bare `ws-relay.mjs`.

### Connecting to a Remote Server

To monitor a remote deployment, append the `wsURL` hash parameter:

```
http://localhost:3002/app-store-monitor/#&wsURL=wss://oversite.example.com
```

## Components Used

| Component | File | Role |
|---|---|---|
| `<app-store-init>` | `src/components/store/app-store-init.js` | Boots the distributed store |
| `<app-store-table>` | `src/components/monitor/app-store-table.js` | Live key/value state table |
| `<app-store-clients>` | `src/components/monitor/app-store-clients.js` | Connected clients list |
| `<app-store-event-table>` | `src/components/monitor/app-store-event-table.js` | Incoming message log as table |
| `<event-log-view>` | `src/components/monitor/event-log-view.js` | Alternative event log view |

## Known Issue: Memory Leak in `app-store-table`

`app-store-table.js` has a known memory leak. Over time (hours to days), the monitor process can consume multiple gigabytes of RAM. The likely cause is unbounded accumulation of event listeners and DOM nodes as state updates arrive.

This is tracked as **R2** in the [roadmap](./roadmap.md). Until fixed:
- Refresh the monitor page periodically if it will be open for extended sessions
- Do not use the monitor as a permanent always-on display without periodic refreshes

## Tips for Debugging Installations

- **Check sender IDs**: If a client isn't showing up in the Clients panel, its `sender` field may not be set. Set it in `app-store-init` or in the client code.
- **Watch for duplicate keys**: If a value is bouncing between two values rapidly, two clients may be fighting over the same key.
- **Use the filter**: In large installations with many keys, filter by prefix (e.g., `lighting_`) to focus on a subsystem.
- **Unicast debugging**: Unicast messages (`receiver` field set) are not visible to all clients, including the monitor, unless the monitor's sender ID matches the `receiver`. For debugging unicast routing, temporarily remove the `receiver` field.
