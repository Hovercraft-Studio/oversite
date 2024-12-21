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

- Bring in changes from Bounty to make developing client web apps nicer w/multiple app paths
- Add Vite view for full current store data table for viewing in realtime
  - Add `sender` so we can see where messages are coming from
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
- Debug components for AppStore - health-check components
  - Heartbeat option
  - True/false or (0/1) option
- Vite Dashboard
  - Show full state of the store in a table
  - Show a list of all connected clients in the UI
  - Add a button to wipe the store
  - Add buttons/dropdowns to wipe all or individual properties in UI
- [MOVED TO package.json] Shared .env between all apps (and TD) for IP addresses and otherwise
- Add a web component that would selectively hydrate the app state from the new api routes
- Add `sender` to TD table
  - Add sender to TD baseComp as a param
