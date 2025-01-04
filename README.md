# hc-socket-server

**hc-socket-server** is a simple websocket server that will relay messages between clients. It also contains a small Vite frontend for testing and visibility, which uses AppStoreDistributed to process messages.

Default locations & ports are:

- ws://localhost:3001/ws - WebSocket server
- http://localhost:3002 - Vite frontend
- http://localhost:3003 - http server

## Install

```bash
git clone https://github.com/Hovercraft-Studio/hc-socket-server.git
cd hc-socket-server
npm install
```

## Run

**Legacy use**: Use `npm run ws` to only start the simple websocket relay server. This is useful for testing the websocket connection without the frontend.

On the frontend, you should use AppStoreDistributed to connect to the websocket server and send messages. See `app-store-demo` for an example.

**Recommended use**: Use `npm run start` to run the robust tooling including: 

- Websocket server (`ws`) on port 3001
- Frontend server (`dev`) on port 3002
- Server app (`server`) on port 3003


**Customizing the run commands**:

You can customize the script commands in `package.json` to use different ports in case the defaults are already in use. 

```json
"dev": "vite --host --port 3002",
"ws": "node ./server/ws-relay.mjs --port 3001 --debug",
"server": "nodemon --watch ./server --ext mjs node ./server/server.mjs --port 3001 --portHttp 3003 --debug",
"start": "concurrently \"npm run dev\" \"npm run server\"",
```

Packages used:

- `concurrently` - Run multiple commands concurrently
- `nodemon` - Automatically restart the node server when files change
- `vite` - Frontend server for the demo UI and monitor


## WebSocket & Server app

There are two ways to run the WebSocket server app:

- Using `ws-relay.mjs` as a barebones websocket server
- Using `server.mjs`, which uses ws-relay.mjs and:
  - Stores all incoming AppStore-formatted messages in a local dictionary
  - Writes the AppStore dictionary to a file on disk and loads on startup
  - Adds a REST API to serve and manage the store state

Running the more robust `server.mjs` allows clients to self-hydrate their specific state from the server on startup (see `app-store-init`'s `init-keys`). It also adds a layer of file-backed persistence to the store (`state.mjs`) - when the server is restarted, the entire state is reloaded. There's also a new Monitor UI (`app-store-monitor`) that shows the complete current state of the store and allows for selective clearing and filtering of keys.

When connecting to the WebSocket server, the URL looks like the following. The `sender` ID is optional, but helps identify the client on the server side. You can also add `sendonly=true` to prevent the client from receiving *any* messages. This would probably only apply to low-power sensor input devices like an ESP32.

```
ws://localhost:3001/ws?sender=tablet
```

### SSL

Managing SSL certificates is a pain, and this project starts with a focus on simplicity for local connections. If SSL connections are required on a browser-based UI (for a tablet, for example), there are a few options:

- The project runs without SSL to make things easy for local connections, especially web browsers on remote devices
- If you need to access SSL-enabled cloud servers, you'll want to use `node-http-proxy` or similar, Or do this on the Node side
- If you need SSL on a tablet for a webcam, you can either run Chrome with permission flags on a Windows Surface tablet, or run Vite with SSL, but then you'd have to proxy all non-SSL connections. This situation is a bit of a pain to navigate, and there's not a perfect answer right now.

### API routes for `server.mjs`

- `GET /state` - Returns the current state of the store
- `GET /state/*` - Returns the json for a specific key in the store
- `GET /wipe` - Clears the store
- `GET /wipe/*` - Clears a specific key in the store
- `GET /clients` - Lists the client connections with sender ID and connection time

## AppStore

AppStore is a key/value store and event-emitting system that is used to store & send simple data *within an app* and *between remote apps*. Within an app, this key/value store should be used for as much internal app state as possible. When connecting multiple apps together, this internal state can then be easily (and optionally) shared via WebSockets, thus syncing up the different apps' internal AppStore state. AppStore WebSocket messages follow a specific json format that is encoded/parsed on the sending/receiving ends of a websocket connection. We now have implementations for:

- JavaScript (Universal) 
- TouchDesigner 
- Java 
- Unreal (WIP)

### The json format:

```json
{
  "key": "some_data",
  "value": "Hello World",
  "store": true,
  "type": "number|string|boolean",
  "sender": "tablet_app", // optional - helps identify the sender
  "receiver": "td_app", // optional - message only sent to receiver
}
```

- `key` (required) - the data key
- `value` (required) - the value of the data
- `store` (required) - lets clients know that it's an AppStore message and should be parsed as such
- `type` (required) - helps parsing the data on the receiving end, especially for strongly-typed languages like Java. Besides setting this value for parsing, please make sure your client is setting the data type correctly on outgoing values
- `sender` (optional) - helps identify the sender of the message, and is used in the Monitor UI. Please implement this in any new clients, both in the connection to the WebSocket server (`/ws?sender=tablet`) and in outgoing messages
- `receiver` (optional) - if a client is streaming data or only wants to send to a specific client, this can be used to target a specific client 
- `sendonly` (optional) - if a client is streaming data and doesn't want it bounced back to itself, this can save some processing  time on a low-powered device like an Arduino

Notes:

- JSON data can be sent as a string, but it's recommended to send single values to reduce JSON data parsing. AppStore prefers one value at a time, and it is common to send multiple message in sequence to update multiple keys
- Keys should all be lowercase, with underscores instead of spaces/dashes
- Client implementations:
  - Should automatically set `store: true`, the data `type`, and `sender` ID when sending messages
  - Should have an optional `broadcast` argument, in case a key/value should be only local
  - When broadcasting a key/value, *should wait for the value to bounce back from the WebSocket server before updating locally*. This way, the app won't get out of sync with shared state across apps/devices in case of a disconnected WebSocket connection. `AppStoreDistributed.set()` handles this automatically, as does the TouchDesigner implementation.
  - Should send a heartbeat value every 5-10 seconds to show the app is still connected. If "sender" is "tablet", then the heartbeat should be "tablet_heartbeat" - the heartbeat key is matched with the sender ID for extra visibility in Monitor UI.

### AppStoreDistributed

AppStoreDistributed is a universal/isomorphic JavaScript class that connects to a websocket server and sends messages in the AppStore format. It listens for incoming AppStore messages and emits them as events in the local app using `_store.addListener()`. This class extends the `AppStore` class, uses `SolidSocket` to ensure reconnection if the websocket server is restarted. Be sure to use the optional `senderId` constructor parameter to help identify the sender of the messages.

### AppStoreInit

Instead of using AppStoreDistributed on its own, it is recommended to use the `app-store-init` web component. The frontend will configure the default server ports and URLs for the WebSocket server backend. You can then customize these addresses/ports in the hash query of the URL and refresh the page to connect to a remote machine that's running the server app. The URL looks like this:

```
http://localhost:3002/app-store-monitor/index.html#&wsURL=ws://localhost:3001/ws&httpPort=3003
```

## Frontend apps

### app-store-demo

This is a "starter app" that demonstrates how to use AppStoreDistributed to connect to the websocket server and send messages. It's a good starting point for building a more complex app that uses AppStore and `hc-socket-server`.

### app-store-monitor

The monitor UI is a simple web app that connects to the server app and displays the current state of the store. It also allows for selective clearing and filtering of keys. The monitor UI is a good tool for debugging and understanding the state of the store.

Some notes on the Monitor UI:

- The Monitor UI needs the full server.mjs to function
- The AppStore table has extra info and state indicators based on the full server.mjs 
- Heartbeats should be in milliseconds since the client app started
  - This lets us see uptime across clients and takes advantage of special formatting and indicators for keys with "heartbeat" in the name
  - If "sender" is "tablet", then the heartbeat should be "tablet_heartbeat" - the heartbeat is matched with the sender ID and the monitor has extra visibility in the client list. If not seen for 20 seconds, the heartbeat row will turn red
- Besides "_heartbeat" keys, there's also a special case for "_health" keys. The monitor will show a red row if the value is false or 0. This can be helpful for monitoring the health of a camera feed, for example, but the value would have to be set in the originating app

### Web Components

Here's a list of web components used in the frontend apps. Each may have optional attributes to customize the behavior of the component.

```html
<!-- AppStore init and helpers -->
<app-store-init sender="tablet" init-keys="app_state btn_toggle" debug side-debug></app-store-init>
<app-store-heartbeat key="tablet_heartbeat" value="n/a" interval="5000" show="false"></app-store-heartbeat>
<event-log-view max-length="10"></event-log-view>

<!-- app-store-element UI subclasses -->
<app-store-button key="app_state" value="attract">Attract</app-store-button>
<app-store-button key="app_state" value="gameplay">Gameplay</app-store-button>
<app-store-button key="app_state" value="game_over">Game Over</app-store-button>
<app-store-button key="btn_pulse" value="1" momentary>Momentary / Pulse</app-store-button>
<app-store-button key="btn_toggle" value="0" toggle>Toggle</app-store-button>
<app-store-textfield key="text_input" value=""></app-store-textfield>
<app-store-slider key="slider_1" value="0" max="1"></app-store-slider>
<app-store-health key="camera_1_health"></app-store-health>

<!-- app-store-monitor -->
<app-store-clients></app-store-clients>
<app-store-table></app-store-table>
<app-store-event-table max-length="20"></app-store-event-table>
```

You can also choose a different [pico.css theme](https://picocss.com/docs/version-picker) and replace `shared/css/pico.css`: 

More to come!