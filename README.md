# OVERSITE

![](public/oversite-logo.png)

**Oversite** is a collection of apps and libraries that connect and monitor site-specific apps and their web extensions.

Apps include:

- **AppStore**: A (shared) state system that glues disparate apps & computers together with WebSockets and a persistent key/value store
- **Dashboard**: An app monitoring dashboard that keeps track of site-specific apps by storing checkins & heartbeats and notifying when apps are down
- **AppStore Monitor**: A web app that connects to the AppStore server and shows the current state of all keys and clients

Default locations & ports are:

- http://localhost:3002 
  - Vite frontend development server (localhost/dev only)
- http://localhost:3003 
  - /api server 
  - static frontend server on production (serves Vite /dist)
- ws://localhost:3003/ws 
  - WebSocket server

## Install / Quickstart

```bash
git clone https://github.com/Hovercraft-Studio/oversite.git
cd oversite
npm install
npm run dev
```

- Open `http://localhost:3002` in a browser and view the UI demo or the Monitor

## Run

Use `npm run dev` to run: 

- The Vite frontend server on port 3002
- The server app (http:// & ws://) on port 3003

**Customizing the run commands**:

You can customize the script commands in `package.json` to use different ports in case the defaults are already in use. 

```json
"dev": "vite --host --port 3002",
"ws": "node ./server/ws-relay.mjs --port 3003 --debug",
"server": "nodemon --watch ./server --ext mjs node ./server/server.mjs --port 3003 --debug",
"start": "concurrently \"npm run dev\" \"npm run server\"",
```

Packages used:

- `concurrently` - Run multiple commands concurrently
- `nodemon` - Automatically restart the node server when files change
- `vite` - Frontend server for the demo UI and monitor


**Legacy use**: Use `npm run ws` to only start the simple websocket relay server. This is useful for testing a websocket connection without the frontend or full server app.


## WebSocket & Server app

There are two ways to run the WebSocket server app:

- Using `server.mjs`, which uses ws-relay.mjs and:
  - Stores all incoming AppStore-formatted messages in a local dictionary
  - Writes the AppStore dictionary to a file on disk and loads on startup
  - Adds a REST API to serve and manage the store state
- ~~Using `ws-relay.mjs` as a barebones websocket server~~ - for legacy/example use only, though this should still work

Running `server.mjs` allows clients to self-hydrate their specific state from the server on startup (see `app-store-init`'s `init-keys`). It also adds a layer of file-backed persistence to the store (`state.mjs`) - when the server is restarted, the entire state is reloaded. There's also a new Monitor UI (`app-store-monitor`) that shows the complete current state of the store and allows for selective clearing and filtering of keys.

When connecting to the WebSocket server, the URL looks like the following. The `sender` ID is optional, but helps identify the client on the server side. You can also add `sendonly=true` to prevent the client from receiving *any* messages. This would probably only apply to low-power sensor input devices like an ESP32.

```
ws://localhost:3003/ws?sender=tablet&sendonly=true
```

### SSL

Managing SSL certificates is a pain, and this project starts with a focus on simplicity for local connections. If SSL connections are required on a browser-based UI (for a tablet, for example), there are a few options:

- The project runs without SSL to make things easy for local connections, especially web browsers on remote devices
- If you need to access SSL-enabled cloud servers, you'll want to use `node-http-proxy` or similar, Or do this on the Node side
- If you need SSL on a tablet for a webcam, you can either run Chrome with permission flags on a Windows Surface tablet, or run Vite with SSL, but then you'd have to proxy all non-SSL connections. This situation is a bit of a pain to navigate, and there's not a perfect answer right now.

### API routes for `server.mjs`

- `GET /api/state/all` - Returns the current state of the store
- `GET /api/state/:key` - Returns the json for a specific key in the store
- `GET /api/state/wipe` - Clears the store
- `GET /api/state/wipe/:key` - Clears a specific key in the store
- `GET /api/state/clients` - Lists all client connections 
- `GET /api/state/clients/:id` - Lists the client connections in a specific channel
- `GET /api/state/channels` - Lists all channels and their clients

## AppStore

AppStore is a key/value store and event-emitting system that is used to store & send simple data *within an app* and *between remote apps*. Within an app, this key/value store should be used for as much internal app state as possible. When connecting multiple apps together, this internal state can then be easily (and optionally) shared via WebSockets, thus syncing up the different apps' internal AppStore state. AppStore WebSocket messages follow a specific json format that is encoded/parsed on the sending/receiving ends of a websocket connection. We now have implementations for:

- JavaScript (Universal) 
- TouchDesigner 
- Java 
- Unreal (WIP)

### The json format:

```json
{
  "key": "some_data",
  "value": "Hello World",
  "store": true,
  "type": "number|string|boolean|array|object",
  "sender": "tablet_app", // optional - helps identify the sender
  "receiver": "td_app", // optional - message only sent to receiver
}
```

- `key` (required) - the data key
- `value` (required) - the value of the data
- `store` (required) - lets clients know that it's an AppStore message and should be parsed as such
- `type` (required) - helps parsing the data on the receiving end, especially for strongly-typed languages like Java. Besides setting this value for parsing, please make sure your client is setting the data type correctly on outgoing values
- `sender` (optional) - helps identify the sender of the message, and is used in the Monitor UI. Please implement this in any new clients, both in the connection to the WebSocket server (`/ws?sender=tablet`) and in outgoing messages
- `receiver` (optional) - if a client is streaming data or only wants to send to a specific client, this can be used to target a specific client 
- `sendonly` (optional) - if a client is streaming data and doesn't want it bounced back to itself, this can save some processing  time on a low-powered device like an Arduino

Notes:

- JSON data can be sent as a string, but it's recommended to send single values to reduce JSON data parsing. AppStore prefers one value at a time, and it is common to send multiple message in sequence to update multiple keys
- Keys should all be lowercase, with underscores instead of spaces/dashes
- Client implementations:
  - Should automatically set `store: true`, the data `type`, and `sender` ID when sending messages
  - Should have an optional `broadcast` argument, in case a key/value should be only local
  - When broadcasting a key/value, *should wait for the value to bounce back from the WebSocket server before updating locally*. This way, the app won't get out of sync with shared state across apps/devices in case of a disconnected WebSocket connection. `AppStoreDistributed.set()` handles this automatically, as does the TouchDesigner implementation.
  - Should send a heartbeat value every 5-10 seconds to show the app is still connected. If "sender" is "tablet", then the heartbeat should be "tablet_heartbeat" - the heartbeat key is matched with the sender ID for extra visibility in Monitor UI.

### AppStoreDistributed

AppStoreDistributed is a universal/isomorphic JavaScript class that connects to a websocket server and sends messages in the AppStore format. It listens for incoming AppStore messages and emits them as events in the local app using `_store.addListener()`. This class extends the `AppStore` class, uses `SolidSocket` to ensure reconnection if the websocket server is restarted. Be sure to use the optional `senderId` constructor parameter to help identify the sender of the messages.

### AppStoreInit

Instead of using AppStoreDistributed on its own, it is recommended to use the `app-store-init` web component. The frontend will configure the default server ports and URLs for the WebSocket server backend. You can then customize these addresses/ports in the hash query of the URL and refresh the page to connect to a remote machine that's running the server app. You can also override the backend server location and avoid the hash query configuration (which is helpful on-site to point machines at others) by using the `ws-url` attribute. The URL looks like this:

```
http://localhost:3002/app-store-monitor/index.html#&wsURL=ws://localhost:3003/ws
```

## Frontend apps

The frontend apps are both a starting point for custom projects and a demo of how to use the `oversite` module. They've been built with simplicty and vanilla JavaScript in mind, to avoid becoming out-of-date with the latest frameworks. The frontend apps rely heavily on `picocss`, which gives decent styling without using any classes. The apps are also built with Web Components, which can be used in any framework or vanilla JavaScript.

### app-store-demo

This is a "starter app" that demonstrates how to use AppStoreDistributed to connect to the websocket server and send messages. It's a good starting point for building a more complex app that uses AppStore and `oversite`.

### app-store-monitor

The monitor UI is a simple web app that connects to the server app and displays the current state of the store. It also allows for selective clearing and filtering of keys. The monitor UI is a good tool for debugging and understanding the state of the store.

Some notes on the Monitor UI:

- The Monitor UI needs the full server.mjs to function
- The AppStore table has extra info and state indicators based on the full server.mjs 
- Heartbeats should be in milliseconds since the client app started
  - This lets us see uptime across clients and takes advantage of special formatting and indicators for keys with "heartbeat" in the name
  - If "sender" is "tablet", then the heartbeat should be "tablet_heartbeat" - the heartbeat is matched with the sender ID and the monitor has extra visibility in the client list. If not seen for 20 seconds, the heartbeat row will turn red
- Besides "_heartbeat" keys, there's also a special case for "_health" keys. The monitor will show a red row if the value is false or 0. This can be helpful for monitoring the health of a camera feed, for example, but the value would have to be set in the originating app

### Web Components

Here's a list of web components used in the frontend apps. Each may have optional attributes to customize the behavior of the component.

```html
<!-- AppStore init and helpers -->
<app-store-init sender="tablet" init-keys="app_state btn_toggle" debug side-debug></app-store-init>
<app-store-heartbeat key="tablet_heartbeat" value="n/a" interval="5000" show="false"></app-store-heartbeat>
<event-log-view max-length="10"></event-log-view>

<!-- app-store-element UI subclasses -->
<app-store-button key="app_state" value="attract">Attract</app-store-button>
<app-store-button key="app_state" value="gameplay">Gameplay</app-store-button>
<app-store-button key="app_state" value="game_over">Game Over</app-store-button>
<app-store-button key="btn_pulse" value="1" momentary>Momentary / Pulse</app-store-button>
<app-store-button key="btn_toggle" value="0" toggle>Toggle</app-store-button>
<app-store-textfield key="text_input" value=""></app-store-textfield>
<app-store-slider key="slider_1" value="0" max="1"></app-store-slider>
<app-store-health key="camera_1_health"></app-store-health>

<!-- app-store-monitor -->
<app-store-clients></app-store-clients>
<app-store-table></app-store-table>
<app-store-event-table max-length="20"></app-store-event-table>
```

You can also choose a different [pico.css theme](https://picocss.com/docs/version-picker) and replace `shared/css/pico.css`: 

## Launch to DigitalOcean

For a cloud Dashboard and AppStore server, we recommend using [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform/). Here's how to set it up:
  
### Setup Instructions:

- Create new App Platform app
- Connect to GitHub repo
- Leave all the defaults, but set the build command to `npm run build` and the run command to `npm start`
  - You can set .env variables noted in .example.env

### How build process works when the project is pulled down from GitHub:

- `vite build` creates `dist` folder, which is served by express
- Express automatically serves the static files from the `dist` folder, as express is the default server
- server.mjs has a few lines to add static paths to `dist` folder
- `vite.config.js` has a few lines to set the base path for the build: `rollupOptions`
- We serve Vite's static `dist` path from express port 3003! So `vite build` output is accessible locally here for testing, and is served as the default from the cloud
- DigitalOcean needs a specific Rollup tool, so `package.json` has a prebuild step: `"prebuild": "npm install @rollup/rollup-linux-x64-gnu --no-save || true",`
- Temp data path for dashboard and persistent state is set in the server.mjs file and reroutes where Vite find things, and where the prod server looks
- Ports are removed on the cloud. Our express app becomes the default server
  - Prod uses its own port for Express: `const PORT = process.env.PORT`
- TODO: Dashboard image paths need to be adjusted here???

### .env configuration

```bash
NODE_ENV=development
VITE_FORCE_LOCAL_AUTH=false # optional, forces auth even in development if set to true
ALLOWED_WS_CHANNELS=default,channel2
AUTH_USERS=admin:password,user2:password
ALERT_PROJECT_IDS=example-project,another-project
```

### Links:

- https://docs.digitalocean.com/products/app-platform/getting-started/sample-apps/express.js/
- https://github.com/digitalocean/sample-expressjs/blob/main/.do/deploy.template.yaml


## Using the `oversite` module in your own project

### Frontend

Create a new frontend project:

- `npm create vite@latest`
- `npm install git@github.com:Hovercraft-Studio/oversite.git#main`
- `npm run dev`

In your Javascript, make sure to import the `oversite` components and any css/js that you want to use:

```javascript
import "oversite/src/components/_register-components.js";

import "oversite/shared/css/pico.css";
import "oversite/shared/css/styles.css";

import MobileUtil from "oversite/src/util/mobile-util.mjs";
import ErrorUtil from "oversite/src/util/error-util.mjs";
```

And at least add the <app-store-init> component for easy connection

```html
<app-store-init
  sender="cms-admin-ui"
  init-keys="*"
  debug
  side-debug
  ws-url="wss://cloudhost.app/ws?channel=app-channel-id&auth=app-auth-token"
></app-store-init>
```

Deployment (current) process (and issues):

- `oversite` is a private repo, and this blows up on Vercel during its `npm install` step.
- This also means that the build step can't work, because it can't get the private repo's code.
- So for now, we have to run `npm build` when we're ready to push to production, commit the `/dist` folder, and deploy that to Vercel. This also meant commenting out `dist` from `.gitignore`.
- On the Vercel config, we replace the build command with `npm run skip-build`, since we can't build it there.
- When `oversite` is made public, we can revert all of this to a normal Vite deployment

To pull the latest from `oversite` if it's already installed and has been updated:

- `npm update oversite`
- Restart dev server!

## Related projects

Others have tackled similar problems in different ways. Here are some projects that are similar to `oversite`:

- [ampm](https://github.com/stimulant/ampm) - Multiple frontend clients - lots of overlap w/`oversite`
- [LaunchPad](https://github.com/bluecadet/launchpad) - ([read more](https://www.bluecadet.com/news/launchpad/))
- [sudoSignals](https://www.sudosignals.com/) - TouchDesigner-focused
- [Phoenix](https://github.com/HeliosInteractive/Phoenix) - C#/Unity-focused
- [ISAAC](https://www.isaacplatform.com/) - More of a professional AV product

## Keeping packages updated

```bash
npm outdated # Check for outdated packages
npm update ws @latest # Update ws to latest version if it was in the list

# or

npx npm-check-updates -u # Update package.json with latest versions
npm install # Install the latest versions
```

Publish package (when public):

```bash
npm login

# switch to main, keep any extra files out of the mix
# then back to dev after publishing
npm version patch # or minor/major
npm publish

# to unpublish older versions if needed - be careful with this command, as it can cause issues for anyone using the package
npm unpublish oversite@1.0.4
```

## More to come!

