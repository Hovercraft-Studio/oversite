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

- Add sender to TD baseComp as a param
- Add a route in server to show clients, w/sender id
- Debug components for AppStore - health-check components
  - Heartbeat option
  - True/false or (0/1) option
  - Add automatic heartbeat component for:
    - TD (Added this in haxademic-td)
    - web UI
    - Node
- Vite Dashboard
  - [WIP] Use the server url in the address bar to figure out the http server url
    - Better conversion of the ws server port (3001) to a specified port (defaulting to 3003 right now). This should be another query param for customization
  - Store data in data objects for sorting & adding
  - Update row data on incoming store update
  - Better flash row when updated
  - Show list of clients w/sender & heartbeat
    - Need an API route that shows clients w/sender
  - Show last updated time
  - Sort data?
  - Treat heartbeats as a special case w/timestamps and red row if out of date
  - Add zoom buttons for table style/padding/font
  - Show a list of all connected clients in the UI
  - Add a button to wipe the store
  - Add buttons/dropdowns to wipe all or individual properties in UI
  - Can we send a message to remove a key on the clients?
  - Can we match sender with client and heartbeat to have a more robust client list?
  - Event log on the side
  - Click to resend a key/value?
- Selectively hydrate the app state from the new api routes
  - WIP Started in AppStoreDistributed
  - TD implementation in AppStore component w/keys par

Nice-to-haves?

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
    - /wipe
    - /wipe/*
    - /info (server info w/uptime, list of connections, etc)
    - what else?
  - How AppStore works
    - Note the format of the messages
    - Sender ID
