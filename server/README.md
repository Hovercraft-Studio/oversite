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

- Serve a single property from the store
- Add a web component that would hydrate the app state from the new api routes