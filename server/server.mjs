import { fileURLToPath } from "url";
import { dirname, join } from "path";
// get relative path to script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// import web server tools
import http from "http";
import express from "express";
const app = express();

// Add dashboard
import ipAddr from "./util.mjs";
import "./dashboard-init.mjs";

// import websocket server and event log
import { wsServer, eventLog } from "./ws-relay.mjs";
import { state, setStateData, removeKey, removeAllKeys } from "./state.mjs";

// listen for incoming store values
wsServer.on("connection", (connection, request, client) => {
  connection.on("message", (message, isBinary) => {
    try {
      const json = JSON.parse(message);
      if (json.store) {
        setStateData(json);
      }
    } catch (error) {
      console.error("Error parsing incoming message:", error);
    }
  });
});

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

// Parse arguments and start server
const args = process.argv.slice(2);
const portArgIndex = args.indexOf("--portHttp");
const httpPort = portArgIndex != -1 ? parseInt(args[portArgIndex + 1]) : 3003;

// Create HTTP server
const server = http.createServer(app);
server.listen(httpPort, () => {
  eventLog(`Web server is running on http://${ipAddr}:${httpPort}`);
});
