## Info: 

- Cloud ws host: `wss://hc-socket-server-v6taf.ondigitalocean.app/ws`;

# TODO

## Get to launch

- Cloudflare: point oversite.hovercraftstudio.com to point to the new server
- Build tiny Big Mother app - can it live on Vercel with serverless functions?
  - Forward all post data to `/` and send it along to oversite.hovercraftstudio.com 
  - Cloudflare: point bigmother.hovercraftstudio.com at mini json-forwarding app
- ASAP: ws:// auth
- ASAP: Persistent state updates

## ATL CMS

- Web updates
  - Pull latest from `oversite` module
  - Add frontend auth-form to main page
    - Password: `r3v0lut10n!`
- Launch to prod
  - CMS: `https://aficms.hovercraftstudio.com/`
  - Java: Need to check the run scripts since jars were updated. probably can just update the run script, but also probably need to re-cache the app from an eclipse build
  - [TEST!] Add serial key commands - on / off
  - [TEST!] Add team switch commands - team = falcons / united
  - Tell Michael @ rEv about the change w/instructions
  - Tell Jasmine about the update

## ws:// auth 

- Implement some version of ws:// auth
  - Check `wsAuthTokens` in config.json
  - Auth should come from either post headers (public devices) or querystring (local devices)
    - Put these into querystring for now, for later implementation
  - Add auth key that only the server knows, via querystring or post header. this should only apply on production, and not on localhost/dev


## Persistent state updates

- For persistent state, we'd probably need a state json file per room! Probably need to add the roomID to the PersistentState endpoints
  - Move server responses to functions while implementing
  - PersistentState needs to handle multiple projects. Can we just use the project name as the key for file and state??
  - AppStore demos would need to handle a projectId
    - AppStoreMonitor has links to PersistentState endpoints and would need to handle a specific project


## AuthApi

- Can `api-url` be a different server? Surely, but let's test
- Basic auth should be on entire site *if it's on production, or specifically enabled for dev*
  - Bypass by checking for ip address, localhost, or .local/.dev domain
- Should auth apply to entire site when on production???
  - We should check cookie anywhere and redirect to /login if not logged in
  - Need to build a tiny page for this login, with a redirect to the original page? Or just `/` for simplicity
- Add optional redirect attribute on successful login

## General

- Move config into own class - between defaults, file loading, and production settings, this could be cleaned up
- We need a big `dist` label on port 3003 if serving static files
- Build a form in AppStore Demo to broadcast test data into AppStore - could live in `app-store-demo`

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


## Server unification:

- Figure out a better debug mode for logging - log levels per app?
- Persistent file storage is a problem on production - how to handle this?
  - Or is it a problem? Can everything be in-memory and rebuild properly on each launch? How badly could this break something down the line?

## Dashboard:

- Update cacheflowe.com with latest api & view classes
- Nodejs DashboardPoster improvements:
  - Resize screenshots if too large? https://www.npmjs.com/package/canvas
  - Screenshot tmp dir should share with main temp paths?
  - Toggle mode: `"no-cors"` and other settings for the fetch() call. Need to test this
- [WIP] Build examples dir for Dashboard poster
  - Unity script
  - Java
- <dashboard-view>
  - Add reload button for manual fetch()
  - Add image size to renderImage() - pull from click listener and remove that
- Documentation
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

- app-store-init should allow for override of sender/sendonly/etc options via querystring, and this would override any attribute settings
- Add 'channel ID' to TD config & connection URL
- Handle `array|object` types - in javascript, these are decoded with the message. in Java, they need to be handled. what about python? or other languages? or if it's not a number|string|boolean, do we just store it as generic json, and detect before decoding?
- Should there be special appStore messages that are system commands? 
  - Like give me a client list or persistent state? Or all clients for the appStoreMonitor?
- How to have multiple AppStoreDistributed clients in one app? One for local and one for cloud. Could they sync?

Nice-to-haves & ideas

- old rooms should currently shut down, but could rogue websocket connections not properly allow this? connected canvas had something to protect against this
- Monitor:
  - Monitor should be able to switch between channels w/a dropdown
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

Nice-to-haves?

- Node system functions available to mobile clients
  - Restart chrome launch script
  - Restart computer
  - Key commands
- Java/Haxademic updates 
  - Add heartbeat to Java client
  - [DONE] Add sender to Java client
  - Add receiver to Java client
  - Add ws?sender= queryparam to Java client
  - Store sender in AppStoreDistributed for incoming messages
- Monitor/frontend
  - Filter event log by client/sender w/a dropdown from client list!
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

