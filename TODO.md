# TODO

## Get to launch

- Clean up api routes port when connecting from an ip address
  - Needs to use https if served from a secure server
- Basic auth should be on entire site *if it's on production, or specifically enabled for dev*
- Wrap up basic Dashboard functions
  - [WIP] Basic auth / password protection
    - Add logout button
    - Check auth cookie behavior w/expiration
    - Add user list json config to be passed in
    - Break out login form into own web component?
    - Should auth apply to entire site when on production???
- Cloudflare: point bigmother.hovercraftstudio.com to point to the new server
- Get ATL app running
  - Get the ATL app built and running on DigitalOcean? Or Vercel?
  - Restart function for Jasmine
    - Needs a Node app? Or are we setting AppStoreDistributed to run on the Java apps?
  - Persistence via local file storage
  - Point to digitalocean app URL in Java app to replace old Hovercraft Subdomain
    - Tell Michael @ rEv about the change w/instructions


## ATL CMS

- Can we use this repo as a module?
  - `npm install git+https://github.com/my-org/hc-socket-server.git#main`
  - `import myModule from 'hc-socket-server/myModule.js';`
  - `npm update` to pull the latest
- How can we build the ATL app from this base? 
  - If we use AppStore:
    - SocketServer and PersistentState need to support channels, since this would have to be on it's own channel
    - Should there be a tiny Node app on the remote PC? That would be good for Jasmine to reset
    - Java App should switch to AppStoreDistributedand save team state in a TextPrefs file
      - When it connects, it should broadcast the current team
      - When the admin app connects, the java app should send back the current team
  - Should it be it's own server with the full implementation, and another server app added? 
  - How do we store the current team selection with persistence? 
  - Or could persistence be held on the FanCam/Protect servers?
  - Can the ATL app be a separate repo? Or should it be a secret page in this app? We probably shouldn't let anyone know about our backend server, but probably should just password protect the whole thing?
  - Could there be a simple node app that runs app-store-distributed and just triggers key commands for a restart initiated by Jasmine?
    - This could also turn the screens on/off by simulating the serial message

## General

- SSL connections break if visiting ip address vs localhost - mostly because ws:// is mixed SSL
  - Test this with chrome flags for Windows machines - doesn't work with Vite SSL and ws://
    - Chromium allows mixed https/ws content but Chrome does not!
    - Flags don't seem to help
    - https://www.damirscorner.com/blog/posts/20210528-AllowingInsecureWebsocketConnections.html
    - https://gist.github.com/hhanh00/ddf3bf62294fc420a0de
  - Does Vite SSL plugin work w/websockets etc? Probably not unless we switch to vite as middleware like cacheflowe.com, but this worth a try, since it could allow for unified dev server ports w/SSL
    - This is actually bad since we don't want vite running on prod! we want to serve the frontend fron /dist
    - `Normally you would run the api middleware separately using an express server for example and proxy requests from your Vite app to that server` - https://dev.to/brense/vite-dev-server-adding-middleware-3mp5
  - Probably won't work on iPad. Test solutions here:
    - Vite SSL 
    - Vite proxy
- Move old haxademic.js files - we don't need to reference that project
- We need a big `dist` label on port 3003 if serving static files
- Build a form in AppStore Demo to broadcast test data into AppStore - could live in `app-store-demo`
- Move haxademic.js libs out of haxademic.js dir - we should decouple from the haxademic.js repo and remove the cruft

## Server unification:

- Auto-build `dist`?
- Figure out a better debug mode for logging - log levels per app?
- Persistent file storage is a problem on production - how to handle this?
  - Or is it a problem? Can everything be in-memory and rebuild properly on each launch? How badly could this break something down the line?
- Handle CORS in one place - right now it's in 2 places. but dashboard API might need it independently

## Documentation

- Opinions:
  - Web Components for futureproofing, but you can use whatever frontend tech you want
  - Keep local dev env as close to cloud env as possible
    - Vite for frontend dev server
      - On prod, we use Vite's `dist` folder, which is served by express
    - Express for backend dev server
  - Frontend should run from a static web server without Vite, and with needing to be built! Vite shortcuts like `@` would prevent this
  - Everything is ephemeral?!
    - Dashboard reconstructs persisted data on the fly, but can be wiped when the server restarts
    - SocketServer rebuilds channels and persisted data on the fly, but can be wiped when the server restarts
- Components
  - Dashboard
    - `dashboard-view` - Frontend component that loads dashboard data
      - `api-url` - where does the api live? allows for a dashboard on a remote frontend, but also helps us find the api (:3003) from Vite (:3002)
      - `server-base` - helps find images on api server (:3003) in dev mode, when frontend is served by Vite (:3002). On prod, this is the same server
      - `refresh-interval` - how often to refresh the data, 60 seconds is a good default
    - `dashboard-api` - Backend component that serves the dashboard data
      - Receives checkin JSON POST data and stores to a local json file. Images are sent as base64 strings but converted to files, which are replaced in the posted json as local www paths, but also with a reference to the file on disk tso we can remove them as the checkin data ages out
      - `/api/dashboard` - base endpoint for the dashboard data
      - `/api/dashboard/json` - Retrieves checkin data for all projects
      - `/api/dashboard/json/:project` - Retrieves checkin data for a specific project
      - `/api/dashboard/delete/:project` - Deletes checkin data for a specific project, along with images on disk
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
    - How to handle local ip addresses? Local DNS server?
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

- Set default dashboard URL in TD to localhost:3002
- Basic auth protection for the dashboard
- Nodejs dashboard example & isomorphic poster class
  - This also needs a local temp path for screenshot image  - this should share with main temp paths
- [WIP] Add dashboard poster example:
  - Make universal for nodejs
    - Detect whether it's running in node or browser
    - Add optional screenshot if nodejs - dynmic import of screenshot module?
    - Add option window size if in browser
    - Toggle mode: `"no-cors"` and other settings for the fetch() call. Need to test this
    - Add nodejs script and call from package.json
- [WIP] Build examples dir for Dashboard poster
  - Universal javascript via node/frontend
    - Have frontend post to backend for easy testing, maybe from 2 apps, with an animating canvas element?
  - TouchDesigner tox
  - Unity script
  - Java
- Add reload button for manual fetch()
- Write up client specs/requirements for a Dashboard client
- Write up how the dashboard works - backend api & frontend
- Look at connecting to AppStoreDistributed
  - Potential Dashboard / AppStore features:
    - Accept checkins via appStore update w/receiver:dashboard
    - Real-time connection status
      - Slack integration (though this doesn't need websockets - could just be a check-in timeout)
    - Run commands like a BA tablet app
    - Show real-time logs
  - Websocket checkin alternative to http polling
    - We could have immdiate response on the dashboard
    - We could send Slack messages when disconnected

Nice-to-haves:

- Slack integration
  - Or other integrations to alert us when a machine is missing
- Can we have different collections of projects???? One Big Mother to rule them all. Or is this just a special view with a different login, but otherwise the structure is all the same?
  - Show specific projects in <dashboard-view> with an attribute. This could allow client-facing dashboards
- Add logging per project?
  - Every project should keep a user/session count and post to dashboard for locally-persisted basic analytics
  - user metrics
  - _health checks


## Socket server

- How to have multiple clients in one app? One for local and one for cloud. Could they sync?
- Add rooms ("channels") concept from Connected Canvas
  - For persistent state, we'd probably need a state json file per room! Probably need to add the roomID to the PersistentState endpoints
    - PersistentState needs to handle multiple projects. Can we just use the project name as the key for file and state??
    - AppStore demos would need to handle a projectId
      - AppStoreMonitor has links to PersistentState endpoints and would need to handle a specific project
  - old rooms should get recycled after [x] days
  - Room creation should require some super basic auth key that only the server knows, via querystring
- Build a Plus-Six-style mouse cursor demo where each client has their own mouse

Nice-to-haves & ideas

- Build an admin page with lists of special commands available for each app deployment. ATL is a good example
- Hydration should happen from websockets instead of http?
- A client should be able to hydrate the persistent state object
- TD hydration implementation in AppStore component w/keys par & json load - model after app-store-init
- An AppStore update should be able to come in via http post
- Move server responses to functions 

SSL

- How to run iPad w/SSL for a webcam, but then proxy all non-SSL connections? Is that possible?

Nice-to-haves?

- Node system functions available to mobile clients
  - Restart chrome launch script
- Java/Haxademic updates 
  - Add heartbeat to Java client
  - Add sender to Java client
  - Add receiver to Java client
  - Add ws?sender= queryparam to Java client
  - Store sender in AppStoreDistributed for incoming messages
- Monitor/frontend
  - Filter event log by client/sender!
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

