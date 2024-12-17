# hc-socket-server

**hc-socket-server** is a simple websocket server that will relay messages between clients. It also contains a small Vite frontend for testing and visibility, which uses App Store Distributed to process messages.

- ws://localhost:3001/ws - websocket server
- http://localhost:3002 - frontend
  - also served at http://`<local-ip-address>`:3002

## Install

```bash
git clone https://github.com/Hovercraft-Studio/hc-socket-server.git
cd hc-socket-server
npm install
```

## Run

To start both the frontend server and the websocket server (useful for testing):

```bash
npm run start
```

To start only the websocket server:

```bash
npm run ws
```

To see all the incoming websocket messages in the terminal, add the `--debug` flag in the package.json `ws` script:

```json
  "ws": "node ./server/ws-relay.mjs --debug",
```
