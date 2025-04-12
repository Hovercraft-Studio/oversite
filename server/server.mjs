/////////////////////////////////////////////////////////
// Import tools
/////////////////////////////////////////////////////////

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getValueFromArgs, ipAddr, eventLog, logBlue } from "./util.mjs";

/////////////////////////////////////////////////////////
// Get relative path to this script
/////////////////////////////////////////////////////////

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDataPath = join(__dirname, "data");

/////////////////////////////////////////////////////////
// Get config from cli args
/////////////////////////////////////////////////////////

const args = process.argv.slice(2);
const wssPort = getValueFromArgs("--port", 3001);
const httpPort = getValueFromArgs("--portHttp", 3003);
const debug = args.indexOf("--debug") != -1;

/////////////////////////////////////////////////////////
// Store config
/////////////////////////////////////////////////////////
const config = {
  dashboardDataPath: join(baseDataPath, "dashboard"),
  dashboardApiRoute: "/dashboard",
};
// add any production overrides
if (process.env.NODE_ENV === "production") {
  Object.assign(config, {
    dashboardApiRoute: "/dashboard",
  });
}
config.debug = debug;
config.isProduction = process.env.NODE_ENV === "production";
config.baseDataPath = baseDataPath;
config.wssPort = wssPort;
config.httpPort = httpPort;
config.ipAddr = ipAddr;

logBlue("===================================");
logBlue("Starting server with config: ------");
console.table([
  [`Node env`, `${process.env.NODE_ENV}`],
  [`config.isProduction`, `${config.isProduction}`],
  [`Local ip address`, `${ipAddr}`],
  [`WebSocket server`, `ws://localhost:${wssPort}/ws`],
  [`HTTP/Express server`, `http://${ipAddr}:${httpPort}`],
  [`debug`, `${config.debug}`],
  [`Base data path`, `${config.baseDataPath}`],
  [`Dashboard data path`, `${config.dashboardDataPath}`],
  [`Dashboard API route`, `${config.dashboardApiRoute}`],
]);
logBlue("===================================");

/////////////////////////////////////////////////////////
// Import web servers
/////////////////////////////////////////////////////////

// basic express server
import http from "http";
import express from "express";
const app = express();
const server = http.createServer(app);

// WebSocket server options:
// - use either port or server depending on environment
// - For cloud apps launch, remove `port`! Example server config here: https://github.com/heroku-examples/node-websockets
import { WebSocketServer } from "ws";
let wssOptions = {
  host: "0.0.0.0", // allows connections from `localhost` *and* IP addresses
  path: "/ws",
};
if (process.env.NODE_ENV === "production") {
  Object.assign(wssOptions, { server: server });
} else {
  Object.assign(wssOptions, { port: wssPort });
}
const wsServer = new WebSocketServer(wssOptions);
wsServer.on("error", (err) => {
  logBlue("⚠️ WebSocket server error:", err);
});
wsServer.on("listening", () => {
  logBlue(`🎉 WebSocket server listening on port ${wsServer.options.port}`);
});
wsServer.on("connection", (ws, req) => {
  logBlue(`WebSocket connection received from ${req.socket.remoteAddress}`);

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Config CORS middleware for permissiveness
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Content-Type", "application/json");
  next();
});

/////////////////////////////////////////////////////////
// Build main server components:
// - WebSocket server with persistence & http API
// - Dashboard API
/////////////////////////////////////////////////////////

import SocketServer from "./socket-server.mjs";
import DashboardApi from "./dashboard-api.mjs";
const socketServer = new SocketServer(wsServer, app, config.baseDataPath, debug);
const dashboardApi = new DashboardApi(app, express, config.dashboardDataPath, config.dashboardApiRoute);
if (debug) dashboardApi.printConfig();

/////////////////////////////////////////////////////////
// Handle 404 after all other routes have been defined
/////////////////////////////////////////////////////////

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

/////////////////////////////////////////////////////////
// Create HTTP server
/////////////////////////////////////////////////////////

// Make sure your production setup is handling the upgrade event
if (process.env.NODE_ENV === "production") {
  // Explicitly handle the upgrade event
  server.on("upgrade", (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      wsServer.emit("connection", ws, request);
    });
  });
}

const PORT = process.env.PORT || httpPort; // prod uses process.env.PORT
server.listen(PORT, () => {
  logBlue(`🎉 Express initialized: http://${ipAddr}:${httpPort}`);
});
