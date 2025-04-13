# TODO

## Next

- Fix dashboard images base path for www route - needs to be different from api route / static file serving
- Figure out how to server Vite app from build dir on Express prod server
- Nodejs dashboard example & isomorphic poster class
  - This also needs a local temp path for screenshot image  - this should share with main temp paths

## General

- Move haxademic.js libs out of haxademic.js dir - we should decouple from the haxademic.js repo and remove the cruft

## Server unification:

- Figure out a better debug mode for logging - log levels per app?
- Persistent file storage is a problem on production - how to handle this?
  - Or is it a problem? Can everything be in-memory and rebuild properly on each launch? How badly could this break something down the line?
- Handle CORS in one place - right now it's in 2 places. but dashboard API might need it independently
- How to handle ports in examples?
  - How to set the options for dashboard location in examples? Or do we just default to the default ports & such. It won't work on the cloud
- ws:// vs wss://
- Vite frontend
  - Build to a public dir served by express
- Launch to DigitalOcean
  - Try their App Platform before doing something custom
  - https://docs.digitalocean.com/products/app-platform/getting-started/sample-apps/express.js/
  - https://github.com/digitalocean/sample-expressjs/blob/main/.do/deploy.template.yaml


## Documentation

- Note the differences between running locally and on the cloud
  - Persistent files
  - Ports
  - SSL connections
    - TD WebSocket needs to set port as 443
    - wss://example-server.ondigitalocean.app/ws
  - CORS
  - Routes
    - /api/state
    - /api/dashboard
    - /ws for upgrade

## Dashboard:

- Fix back button
- [WIP] Add dashboard poster example:
  - Make universal for nodejs
    - Detect whether it's running in node or browser
    - Add optional screenshot if nodejs - dynmic import of screenshot module?
    - Add option window size if in browser
    - Toggle mode: `"no-cors"` and other settings for the fetch() call. Need to test this
    - Add nodejs script and call from package.json
- Basic auth protection for the dashboard
- Build examples dir for Dashboard poster
  - Universal javascript via node/frontend
    - Have frontend post to backend for easy testing, maybe from 2 apps, with an animating canvas element?
  - TouchDesigner tox
  - Unity script
  - Java
- Write up client specs/requirements for a Dashboard client
- Write up how the dashboard works - backend api & frontend
- Slack integration
  - Or other integrations to alert us when a machine is missing
- Add a general-use websocket server
  - Consider uses for Miami Heat / PlusSix implementations
- Can we have different collections of projects???? One Big Mother to rule them all. Or is this just a special view with a different login, but otherwise the structure is all the same?
- Add logging per project?
  - Every project should keep a user/session count and post to dashboard for locally-persisted basic analytics
  - user metrics
  - _health checks
- Look at connecting to AppStoreDistributed
  - Potential Dashboard / AppStore features:
    - Real-time connection status
      - Slack integration (though this doesn't need websockets - could just be a check-in timeout)
    - Run commands like a BA tablet app
    - Show real-time logs
  - Websocket checkin alternative to http polling
    - We could have immdiate response on the dashboard
    - We could send Slack messages when disconnected

## Socket server

- Touchdesigner connect to cloud socket server - which port works? Does wss work?
- Add rooms concept from connected canvas
  - For persistent state, we'd probably need a state json file per room! Probably need to add the roomID to the PersistentState endpoints
    - PersistentState needs to handle multiple projects. Can we just use the project name as the key for file and state??
    - AppStore demos would need to handle a projectId
      - AppStoreMonitor has links to PersistentState endpoints and would need to handle a specific project
  - old rooms should get recycled after [x] days
  - Room creation should require some super basic auth key that only the server knows, via querystring
- How to handle wss:// ? Check connected canvas
- Hydration should happen from websockets instead of http, but maybe keep that for non ws:// connections


## TODO (Moved from /server/README.md):

- TD hydration implementation in AppStore component w/keys par & json load - model after app-store-init
- Monitor:
- Move server responses to functions 
- Test http-proxy

SSL

- How to run iPad w/SSL for a webcam, but then proxy all non-SSL connections? Is that possible?

Nice-to-haves?

- Java/Haxademic updates 
  - Add heartbeat to Java client
  - Add sender to Java client
  - Add receiver to Java client
  - Add ws?sender= queryparam to Java client
  - Store sender in AppStoreDistributed for incoming messages
- Monitor/frontend
  - Click to resend a key/value from Monitor. anything else useful here?
  - add "expected_clients" list to app-store-clients, and show a red row if a client is missing
  - QR code somewhere to launch BA app (or any link for a client app)
  - Client list last message sent time?
  - Filter event table by client?
  - Add these to the client storage? or maybe just keep these in the Monitor?
    - Add `sender` to JS table (added to AppStoreDistributed via `getData()`)
    - Add `sender` to TD table
  - Add a button to wipe the store (it will repopulate as messages come in)
  - Can we send a message to remove a key on the clients?
- ws-relay
  - chatroom option to separate channels?
- In `/state`, can we filter rather than just return entire or single key?

