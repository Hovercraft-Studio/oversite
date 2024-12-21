# Server app

There are two ways to run the server app:

- Using `ws-relay.mjs` as a barebones websocket server
- Using `server.mjs`, which uses ws-relay.mjs and:
  - Stores all incoming AppStore-formatted messages in a local dictionary
  - Writes the dictionary to a file on disk and loads on startup
  - Adds a REST API to serve and manage the store state

Running the more robust `server.mjs` allows clients to self-hydrate their specific state from the server on startup. It also adds a layer of persistence to the store, which is helpful as the server may be restarted. These features allow for a much more robust shared state system as components come online or are restarted.

## API routes

- `GET /state` - Returns the current state of the store
- `GET /state/*` - Returns the json for a specific key in the store
- `GET /wipe` - Clears the store
- `GET /wipe/*` - Clears a specific key in the store

## TODO:

- Shared .env between all apps (and TD) for IP addresses and otherwise
- Show a list of all connected clients in the UI
- Add a web component that would selectively hydrate the app state from the new api routes
- Fix IP address in querystring in client demo app
- Bring in changes from haxademic-td web components and continue here
- Bring in changes from Bounty to make developing client web apps nicer w/multiple app paths
- Add machine/app ID when setting up AppStoreDistributed to identify connected events and add to sender messages
  - Add `sender` to TD table
  - Add buttons/dropdowns to wipe all or individual properties in UI
  - Add sender to TD baseComp as a param
- Add Vite view for full current store data table for viewing in realtime
  - Add `sender` so we can see where messages are coming from
- Fix AppStore demo ui ip address
- Debug components for AppStore - health-check components
  - Heartbeat option
  - True/false or (0/1) option
