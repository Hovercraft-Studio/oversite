import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getValueFromArgs, ipAddr, eventLog } from "./util.mjs";

// get relative path to script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDataPath = join(__dirname, "data");

// get config from cli args
const args = process.argv.slice(2);
const wssPort = getValueFromArgs("--port", 3001);
const httpPort = getValueFromArgs("--portHttp", 3003);
const debug = args.indexOf("--debug") != -1;
console.log("Debug mode:", debug);
console.log("WebSocket server port:", wssPort);
console.log("HTTP server port:", httpPort);

// import web server tools
import http from "http";
import express from "express";
const app = express();

// import websocket server
import { WebSocketServer } from "ws";
const wsServer = new WebSocketServer({
  port: wssPort,
  host: "0.0.0.0", // allows connections from localhost and IP addresses
  path: "/ws",
}); // For Heroku launch, remove `port`! Example server config here: https://github.com/heroku-examples/node-websockets
eventLog(
  `Running WebSocket server at port: ${wssPort}`,
  `Connect at ws://localhost:${wssPort}/ws`,
  `or ws://${ipAddr}:${wssPort}/ws`
);

// Add dashboard
import "./dashboard-init.mjs";

import PersistentState from "./persistent-state.mjs";
import SocketServer from "./socket-server.mjs";
const persistentState = new PersistentState(wsServer, baseDataPath, "state");
const socketServer = new SocketServer(wsServer, persistentState, debug);

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
  if (persistentState.getState(key)) {
    res.json(persistentState.getState(key));
  } else {
    res.json(null);
  }
});

app.get("/state", (req, res) => {
  res.json(persistentState.getAll());
});

app.get("/wipe/:key", (req, res) => {
  const key = req.params.key;
  persistentState.removeKey(key);
  res.json(persistentState.getAll());
});

app.get("/wipe", (req, res) => {
  persistentState.removeAllKeys();
  res.json(persistentState.getAll());
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
