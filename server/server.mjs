/////////////////////////////////////////////////////////
// Import tools
/////////////////////////////////////////////////////////

import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import path from "path";
import { getValueFromArgs, ipAddr, eventLog, logBlue } from "./util.mjs";

/////////////////////////////////////////////////////////
// Get relative path to this script
/////////////////////////////////////////////////////////

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDataPath = join(__dirname, "../", "public", "_tmp_data"); // Go up one level from server/ to project root
const prodDataPath = join(__dirname, "../", "dist", "_tmp_data"); // Go up one level from server/ to project root

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
  stateDataPath: join(baseDataPath, "state"),
  dashboardDataPath: join(baseDataPath, "dashboard"),
  dashboardApiRoute: "/api/dashboard",
  dashboardPostRouteAlt: "/",
};
// add any production overrides
if (process.env.NODE_ENV === "production") {
  Object.assign(config, {
    stateDataPath: join(prodDataPath, "state"),
    dashboardDataPath: join(prodDataPath, "dashboard"),
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
  [`Dashboard API & POST route`, `${config.dashboardApiRoute}`],
  [`Dashboard POST route (alt)`, `${config.dashboardPostRouteAlt}`],
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

// Config CORS middleware for maximum permissiveness
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Serve Vite frontend files from the dist folder
// We can test prod behavior by going to `localhost:3003`, which is what's served in production
const DIST_PATH = path.join(path.resolve(), "dist");
app.use("/", express.static(DIST_PATH));
app.use("/public", express.static(path.join(__dirname, "../public")));
app.use("/_tmp_data", express.static(baseDataPath));

/////////////////////////////////////////////////////////
// Build main app components:
// - WebSocket server with persistence & http API
// - Dashboard API
/////////////////////////////////////////////////////////

import SocketServer from "./socket-server.mjs";
import DashboardApi from "./dashboard-api.mjs";
const socketServer = new SocketServer(wsServer, app, config.stateDataPath, debug);
if (debug) dashboardApi.printConfig();
const dashboardApi = new DashboardApi(
  app,
  express,
  config.dashboardDataPath,
  config.dashboardApiRoute,
  config.dashboardPostRouteAlt
);

/////////////////////////////////////////////////////////
// Init HTTP server
/////////////////////////////////////////////////////////

// Handle 404 after all other routes have been defined
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const PORT = process.env.PORT || httpPort; // prod uses process.env.PORT
server.listen(PORT, () => {
  logBlue(`🎉 Express initialized: http://${ipAddr}:${httpPort}`);
});
