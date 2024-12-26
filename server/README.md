# Server app

There are two ways to run the WebSocket server app:

- Using `ws-relay.mjs` as a barebones websocket server
- Using `server.mjs`, which uses ws-relay.mjs and:
  - Stores all incoming AppStore-formatted messages in a local dictionary
  - Writes the AppStore dictionary to a file on disk and loads on startup
  - Adds a REST API to serve and manage the store state

Running the more robust `server.mjs` allows clients to self-hydrate their specific state from the server on startup. It also adds a layer of persistence to the store, which is helpful as the server may be restarted. These features allow for a much more robust shared state system as components come online or are restarted. There's also a new monitoring UI that shows the current state of the store and allows for selective clearing of keys.

## API routes for `server.mjs`

- `GET /state` - Returns the current state of the store
- `GET /state/*` - Returns the json for a specific key in the store
- `GET /wipe` - Clears the store
- `GET /wipe/*` - Clears a specific key in the store

## TODO:

- Debug components for AppStore - health-check components for camera feeds, etc
  - True/false or (0/1) option
- Add heartbeat component in TD (Added this in haxademic-td, but needs to send uptime ms)!
- Vite Dashboard
  - Design
    - Header w/title
    - Footer w/links
    - QR code somewhere to launch BA app (or any link for a client app)
    - Heartbeat flashes should be lower priority than non-heartbeat flashes. maybe just gray?
  - Store data in data objects for sorting & adding
    - Update row data on incoming store update (right now it just flashes the row)
    - Keep HTML elements instead of re-rendering each update, so we keep animations running
    - Better flash on row when updated
    - [WIP] Show last updated time
  - Show list of clients w/sender & heartbeat
    - Can we match sender with client and heartbeat to have a more robust client list?
    - Last message sent time
  - Sort data?
    - By App
    - Then alphabetically
  - Filter data
    - Toggle to show/hide heartbeats since they take up so much space in the log
  - Treat heartbeats as a special case w/timestamps and red row if out of date
  - Add zoom buttons for table style/padding/font
  - Nice-to-haves
    - Click to resend a key/value?
    - Add a button to wipe the store (it will repopulate as messages come in)
    - Add buttons/dropdowns to wipe all or individual properties in UI
    - Can we send a message to remove a key on the clients?
- Selectively hydrate the app state from the new api routes
  - WIP Started in AppStoreDistributed - `init-keys`
  - TD implementation in AppStore component w/keys par & json load
    - Need a server port config in the TD app component

Nice-to-haves?

- Java/Haxademic updates 
  - Add heartbeat to Java client
  - Add sender to Java client
  - Add ws?sender= queryparam to Java client
- Maybe just keep these in the Monitor?
  - Add `sender` to JS table
  - Add `sender` to TD table
- In `/state`, can we filter rather than just return entire or single key?
- [MOVED TO package.json] Shared .env between all apps (and TD) for IP addresses and otherwise

## TODO: Documentation

- Add notes in README about:
  - How to customize ip addresses/ports, and what the default are for:
    - ws-relay
    - vite demo UI (and how to change the port for the ws server in the hash query)
    - server.mjs
  - Routes in server.mjs
    - /state
    - /state/*
    - /clients
    - /wipe
    - /wipe/*
    - /info (server info w/uptime, list of connections, etc)
    - what else?
  - How AppStore works
    - `ws//` connection specs:
      - port is configurable
      - `/ws?sender=ba_ui`
      - `Client joined from ws://localhost:3001/ws?sender=BA_UI - We have 3 users`
        - sender is attached to the client for identification on the server
      - sender is optional but should be attached to outgoing messages in other clients
    - Note the format of the messages w/all optional params
    - keys should all be lowercase, with underscores instead of spaces/dashes
      - Example: `node_app`
      - Example: `tablet_app`
      - Example: `tablet_heartbeat`
    - Sender ID
      - Use `ws//` queryparam `sender` to set the sender ID on initial connection
      - Need to add this to the TD/Java/Node clients. AppStoreDsitributed already has this
      - Automatically gets attached to all messages sent from that client
    - Heartbeats
      - Should be in milliseconds
      - This lets us see uptime across clients and takes advantage of special formatting and indicators for keys with "heartbeat" in the name
      - If "sender" is "ba_ui", then the heartbeat should be "ba_ui_heartbeat", and then we have more indication in the client list, and the heartbeat is matched with the sender ID
    - Monitor app:
      - URL scheme & customizable ports w/defaults:
        - http://localhost:3002/app-store-monitor/index.html#&server=ws://192.168.1.205:3001/ws&httpPort=3003
  - Notable web components for free UI functionality
    - Note options for each (ex: app-store-debug `debug side-debug`)