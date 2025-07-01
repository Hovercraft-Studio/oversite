## Info: 

Vanity URLs
- `wss://oversite.hovercraftstudio.com/ws`
- `https://oversite.hovercraftstudio.com/`
Vercel URLs
- `wss://oversite-t9f7i.ondigitalocean.app/ws`
- `https://oversite-t9f7i.ondigitalocean.app/`

# TODO

- Slack integration (this doesn't need websockets - could just be a check-in timeout, but probably better to use the websocket connection)
  - Build a link to the project on the dashboard so you can click into the latest checkins
  - Add a webhook config option, and only init if it exists

## Get to launch

- DO WE NEED AUTH IF IT'S NOT PUBLIC?
  - : ws:// auth key in URL & server side
- Authenticate entire site (web component that checks auth cookie?)
- Kill bigmother.hovercraftstudio.com once we switch to new endpoint

## ws:// auth 

- When connecting from the production domain, we don't need to auth!
- Implement some version of ws:// auth
  - Check `wsAuthTokens` in config.json
  - Auth should come from either post headers (public devices) or querystring (local devices)
    - Put these into querystring for now, for later implementation
  - Add auth key that only the server knows, via querystring or post header. this should only apply on production, and not on localhost/dev
- Config cleanup
  - if not production mode, add "default" to allowed ws channels array
  - Move to .env file from config.json
    - *only* production info shoud be in .env - everything local should work out of the box


## Persistent state updates

- For persistent state, we'd probably need a state json file per room! Probably need to add the roomID to the PersistentState endpoints
  - Move server responses to functions while implementing
  - PersistentState needs to handle multiple projects. Can we just use the project name as the key for file and state??
  - AppStore demos would need to handle a projectId
    - AppStoreMonitor has links to PersistentState endpoints and would need to handle a specific project


## AuthApi

- auth-form
  - should have a reload on success, or a redirect to the original page
- Should auth apply to entire site when on production???
  - We should check cookie anywhere and redirect to /login if not logged in
  - Need to build a tiny page for this login, with a redirect to the original page? Or just `/` for simplicity
- Can `api-url` be a remote server? Surely, but let's test
- Basic auth should be on entire site *if it's on production, or if specifically enabled for dev*
  - Bypass by checking for ip address, localhost, or .local/.dev domain
- Add optional redirect attribute on successful login

## General

- Move config into own class - between defaults, file loading, and production settings, this could be cleaned up
- We need a big `dist` label on port 3003 if serving static files
- Build a form in AppStore Demo to broadcast test data into AppStore - could live in `app-store-demo`
- Add modal example

## SSL

- Clean up api routes port when connecting from an ip address
  - ws:// Needs to use https if served from a secure server
- How to run iPad w/SSL for a webcam, but then proxy all non-SSL connections? Is that possible?
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

## Dashboard:

- Make nodejs demo for dashboardposter with a project that uses npm install. How to do this? Should be super easy to initialize a new project and install the dashboardposter package. 
  - This kind of overlaps with the .exe option but would be lighter weight
- Update cacheflowe.com with latest api & view classes
- Nodejs DashboardPoster improvements:
  - Show example of just using it to send screenshots. These should be taken out of Java implementation because they're unreliable
  - Resize screenshots if too large? https://www.npmjs.com/package/canvas
  - Screenshot tmp dir should share with main temp paths?
  - What's up with the `"no-cors"` and other settings for the fetch() call? Need to test this
- Look at connecting to AppStoreDistributed
  - Potential Dashboard (w/ optional instance of) AppStoreDistributed features:
    - Accept checkins via appStore update w/receiver = "dashboard"!!!!
      - But would this need a separate AppStoreDistributed instance for each app to be on the Dashboard channel? Or can the DashboardApi have a websocket server `onmessage` listener to pull in the specific checkin messages? This seems like the right way to route traffic
      - We could also have realtime connection/disconnection status via the dashboard. But how to identify the client associated? We'd probably need to send an extra initial connection message to identify as a machine that should be tracked on the dashboard with `app-id`
    - Real-time connection status
  - Run commands like a BA tablet app
  - Show real-time logs
- Do we need authentication to post to the dashboard? Probably not, but good to note that this is unprotected

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

- Add 'channel ID' and 'auth key' to TD config & connection URL
- How to have multiple AppStoreDistributed clients in one app? One for local and one for cloud. Could they sync? 
  - And how would Dashboard and production AppStoreDistributed sync?
- app-store-init should allow for override of sender/sendonly/etc options via querystring, and this would override any attribute settings
- AppStore Monitor has a nasty memory leak - can consume multiple GB of ram over time. Likely culprit is `app-store-table` component
- Handle `array|object` types - in javascript, these are decoded with the message. in Java, they need to be handled. what about python? or other languages? or if it's not a number|string|boolean, do we just store it as generic json, and detect before decoding?
- Should there be special appStore messages that are system commands? 
  - Like give me a client list or persistent state? Or all clients for the appStoreMonitor?

Nice-to-haves & ideas

- old rooms should currently shut down, but could rogue websocket connections not properly allow this? connected canvas had something to protect against this
- Monitor:
  - Monitor should be able to switch between channels w/a dropdown - right now it only shows the default channel
  - Monitor's client list should be rebuilt with websockets instead of http polling
- Build an admin page with lists of special admin commands (appstore key-value messages) available for each app deployment. ATL is a good example
- Hydration updates:
  - Hydration should happen from websockets instead of http?
  - A client should be able to hydrate the persistent state object
  - TD hydration implementation in AppStore component w/keys par & json load - model after app-store-init
- An AppStore update should be able to come in via http post?
- Cool demos:
  - PlusSix-style interface - allow user connection and build temporary rooms
  - Figma mouse cursor demo where each client has their own mouse. Allow actual clicking
  - PONG game? Bonus points for running game logic on the server
  - Multi-browser slideshow

## Testing

- All apps should be tested with:
  - localhost, ip address, 
  - http/https & ws/wss
  - production server
  - config.json & defaults

## Server unification:

- Figure out a better debug mode for logging - log levels per app?
- Persistent file storage is a problem on production - how to handle this?
  - Or is it a problem? Can everything be in-memory and rebuild properly on each launch? How badly could this break something down the line?

Nice-to-haves?

- Node system functions available to mobile clients
  - Restart chrome launch script
  - Restart computer
  - Key commands
- Java/Haxademic updates 
  - Add heartbeat to Java client - Not needed now that the server sends a heartbeat
  - [DONE] Add sender to Java client
  - Add `receiver` to Java client
  - Add ws?sender= queryparam to Java client
  - Store sender in AppStoreDistributed for incoming messages
- Monitor/frontend
  - Filter event log/table by client/sender w/a dropdown from client list!
  - Click to resend a key/value from Monitor. anything else useful here?
  - add "expected_clients" list to app-store-clients, and show a red row if a client is missing
  - QR code somewhere to launch BA app (or any link for a client app)
  - Client list last message sent time?
  - Add these to the client storage? or maybe just keep these in the Monitor?
    - Add `sender` to JS table (added to AppStoreDistributed via `getData()`)
    - Add `sender` to TD table
  - Add a button to wipe the store (it will repopulate as messages come in)
  - Can we send a message to remove a key on the clients?
- ws-relay
  - chatroom option to separate channels?
- In `/state`, can we filter rather than just return entire or single key?

