import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getValueFromArgs } from "./util.mjs";

// get relative path to script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDataPath = join(__dirname, "data");

// get config from cli args
const args = process.argv.slice(2);
const portWssIndex = getValueFromArgs("--port", 3001);
const httpPort = getValueFromArgs("--portHttp", 3003);
const debug = args.indexOf("--debug") != -1;
console.log("Debug mode:", debug);
console.log("WebSocket server port:", portWssIndex);
console.log("HTTP server port:", httpPort);

// import web server tools
import http from "http";
import express from "express";
const app = express();

// Add dashboard
import ipAddr from "./util.mjs";
import "./dashboard-init.mjs";

// import websocket server and event log
import { wsServer, eventLog } from "./ws-relay.mjs";

import PersistentState from "./persistent-state.mjs";
// import SocketServer from "./socket-server.mjs";
const persistentState = new PersistentState(wsServer, baseDataPath, "state");
// const SocketServer = new SocketServer(wsServer, persistentState);

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Content-Type", "application/json");
  next();
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to AppStore" });
});

app.get("/state/:key", (req, res) => {
  const key = req.params.key;
  if (state[key]) {
    res.json(state[key]);
  } else {
    res.json(null);
  }
});

app.get("/state", (req, res) => {
  res.json(state);
});

app.get("/wipe/:key", (req, res) => {
  const key = req.params.key;
  removeKey(key);
  res.json(state);
});

app.get("/wipe", (req, res) => {
  removeAllKeys();
  res.json(state);
});

app.get("/clients", (req, res) => {
  let clients = [];
  wsServer.clients.forEach((client) => {
    clients.push({
      sender: client.senderID,
      connectedTime: Date.now() - client.startTime,
    });
  });
  res.json(clients);
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Create HTTP server
const server = http.createServer(app);
server.listen(httpPort, () => {
  eventLog(`Web server is running on http://${ipAddr}:${httpPort}`);
});
