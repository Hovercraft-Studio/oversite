# TODO

## Next

- [DONE?] Fix SSL connections w/ports on production. AppStoreInit probably needs to check for https: and set the rest accordingly
- Fix dashboard images base path for www route - needs to be different from api route / static file serving
  - Check between `vite/public` and `prod/dist` - hopefully there's a good solution for this
- We need a big `dist` label on port 3003 if serving static files
- Nodejs dashboard example & isomorphic poster class
  - This also needs a local temp path for screenshot image  - this should share with main temp paths

## Big Mother replacement

- Test having dashboard api at `/` for big mother replacement


## ATL CMS

- How can we build the ATL app from this base? 
  - Should it be it's own server with the full implementation, and another server app added? 
  - Or would it use it's own room for websocket/AppStore commands for reset? 
  - How do we store the current team selection with persistence? 
  - Or could persistence be held on the FanCam/Protect servers?
  - Can the ATL app be a separate repo? Or should it be a secret page in this app? We probably shouldn't let anyone know about our backend server, but probably should just password protect the whole thing?
  - Could there be a simple node app that runs app-store-distributed and just triggers key commands for a restart initiated by Jasmine?

## General

- Build a form to broadcast test data into AppStore - could live in `app-store-demo`
- Move haxademic.js libs out of haxademic.js dir - we should decouple from the haxademic.js repo and remove the cruft

## Server unification:

- Figure out a better debug mode for logging - log levels per app?
- Persistent file storage is a problem on production - how to handle this?
  - Or is it a problem? Can everything be in-memory and rebuild properly on each launch? How badly could this break something down the line?
- Handle CORS in one place - right now it's in 2 places. but dashboard API might need it independently

## Documentation

- Opinions:
  - Keep local dev env as close to cloud env as possible
    - Vite for frontend dev server
      - On prod, we use Vite's `dist` folder, which is served by express
    - Express for backend dev server
- Note the differences between running locally and on the cloud
  - Persistent files
  - Ports
    - Prod uses its own port for Express: `const PORT = process.env.PORT`
  - SSL connections
    - TD WebSocket needs to set port as 443
      - wss://example-server.ondigitalocean.app/ws
    - Locally-running web apps *can* connect to remote wss:// on the cloud! Just remove the port by setting it to `80`, `443` or empty. Browser permissions allow SSL permissiveness as long as CORS is set up properly on the server.
      - http://localhost:3002/app-store-monitor/index.html#&wsURL=wss://example.ondigitalocean.app/ws&httpPort=
      - `app-store-init` checks for ports passed in via querystring and removes them on the cloud
  - CORS
  - Routes
    - /api/state
    - /api/dashboard
    - /ws for upgrade
- Launch to DigitalOcean
  - WIP: Note build process once that's figured out
    - `vite build` creates `dist` folder, which is served by express
      - server.mjs has a few lines to add static paths to `dist` folder
      - `vite.config.js` has a few lines to set the base path for the build: `rollupOptions`
      - DigitalOcean needs a specific rollup tool, so`package.json` has a prebuild step: `"prebuild": "npm install @rollup/rollup-linux-x64-gnu --no-save || true",`
      - Express automatically serves the static files from the `dist` folder, because express is the default server
      - We serve Vite's static `dist` path from express port 3003! So `vite build` output is accessible locally here for testing, and is served as the default from the cloud
      - Temp data path for dashboard and persistent state is set in the server.mjs file and reroutes where Vite find things, and where the prod server looks
      - Ports are removed on the cloud. our express app becomes the default server
      - TODO: Dashboard image paths need to be adjusted here???
  - https://docs.digitalocean.com/products/app-platform/getting-started/sample-apps/express.js/
  - https://github.com/digitalocean/sample-expressjs/blob/main/.do/deploy.template.yaml

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

