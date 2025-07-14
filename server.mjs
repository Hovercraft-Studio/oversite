/////////////////////////////////////////////////////////
// Import tools
/////////////////////////////////////////////////////////

import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { dirname, join, resolve } from "path";
import path from "path";
import { getCliArg, ipAddr, eventLog, logBlue } from "./src/server/util.mjs";
import { config as dotenvConfig } from "dotenv";

/////////////////////////////////////////////////////////
// Get relative path to this script
/////////////////////////////////////////////////////////

const __filename = fileURLToPath(import.meta.url);
const appRoot = dirname(__filename);
const distPath = join(appRoot, "dist");
const publicPath = join(appRoot, "public");
const baseDataPath = join(appRoot, "public", "_tmp_data");
const prodDataPath = join(appRoot, "dist", "_tmp_data");
const envPath = join(appRoot, ".env");

/////////////////////////////////////////////////////////
// Get config from cli args
/////////////////////////////////////////////////////////

const args = process.argv.slice(2);
const PORT = process.env.PORT ?? getCliArg("--port", 3003); // prod uses process.env.PORT, but dev uses --port arg
const debug = args.indexOf("--debug") != -1;

/////////////////////////////////////////////////////////
// Get config from .env
/////////////////////////////////////////////////////////

dotenvConfig({ path: envPath }); // Explicitly set path for .env relative to appRoot

// get allowed ws:// channels from .env
// - this is a comma separated list of channels that are allowed to connect to the websocket server
let allowedWsChannels = process.env.ALLOWED_WS_CHANNELS || "default"; // comma separated list of channels
if (allowedWsChannels) {
  allowedWsChannels = allowedWsChannels.split(",").map((channel) => channel.trim());
}
// get auth users from .env
// - this is a comma separated list of users that are allowed to connect to the websocket server
// - format: username:password,username2:password2
let authUsers = process.env.AUTH_USERS || "admin:password"; // comma separated list of users
if (authUsers) {
  authUsers = authUsers.split(",").map((user) => {
    const [username, password] = user.split(":").map((item) => item.trim());
    return { username, password };
  });
}

/////////////////////////////////////////////////////////
// Store config
/////////////////////////////////////////////////////////

const config = {
  stateDataPath: join(baseDataPath, "state"),
  allowedWsChannels: allowedWsChannels,
  authUsers: authUsers,
  dashboardDataPath: join(baseDataPath, "dashboard"),
  dashboardApiRoute: "/api/dashboard",
  dashboardPostRouteAlt: "/",
  debug: debug,
  isProduction: process.env.NODE_ENV === "production",
  baseDataPath: baseDataPath,
  ipAddr: ipAddr,
};
// add any production overrides
if (config.isProduction) {
  Object.assign(config, {
    stateDataPath: join(prodDataPath, "state"),
    dashboardDataPath: join(prodDataPath, "dashboard"),
  });
}

logBlue("===================================");
logBlue("Starting server with config: ------");
console.table([
  [`.env.ALLOWED_WS_CHANNELS`, `${process.env.ALLOWED_WS_CHANNELS}`],
  [`.env.AUTH_USERS`, `${process.env.AUTH_USERS}`],
  [`.env.NODE_ENV`, `${process.env.NODE_ENV}`],
  [`config.isProduction`, `${config.isProduction}`],
  [`Local ip address`, `${ipAddr}`],
  [`WebSocket server`, `ws://localhost:${PORT}/ws`],
  [`HTTP/Express server`, `http://${ipAddr}:${PORT}`],
  [`debug`, `${config.debug}`],
  [`Base data path`, `${config.baseDataPath}`],
  [`ws:// channels`, `${config.allowedWsChannels}`],
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
import cors from "cors";
const app = express();
const server = http.createServer(app);

// WebSocket server options:
// - use port *xor* server depending on environment. you only need a port if there's no server, but could set ws traffic to a different port if you want
// - if you change the port/server config, make sure you check for the environment to toggle settings
import { WebSocketServer } from "ws";
const wsServer = new WebSocketServer({
  host: "0.0.0.0", // allows connections from `localhost` *and* IP addresses
  path: "/ws",
  server: server,
});

// Config CORS middleware for maximum permissiveness
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Serve Vite frontend files from the dist folder
// We can test prod behavior by going to `localhost:3003`, which is what's served in production
app.use("/", express.static(distPath));
app.use("/public", express.static(publicPath));
app.use("/_tmp_data", express.static(baseDataPath)); // This uses the initial baseDataPath: appRoot/public/_tmp_data

/////////////////////////////////////////////////////////
// Build main app components:
// - WebSocket server with persistence & http API
// - Dashboard API
/////////////////////////////////////////////////////////

import AuthApi from "./src/server/auth-api.mjs";
import SocketServer from "./src/server/socket-server.mjs";
import DashboardApi from "./src/server/dashboard-api.mjs";
DashboardApi.addJsonMiddleware(app, express, cors);
const authApi = new AuthApi(app, express, config.authUsers);
const socketServer = new SocketServer(wsServer, app, config.stateDataPath, config.allowedWsChannels, debug);
const dashboardApi = new DashboardApi(
  app,
  express,
  config.dashboardDataPath,
  config.dashboardApiRoute,
  config.dashboardPostRouteAlt
);
if (debug) dashboardApi.printConfig();

/////////////////////////////////////////////////////////
// Init HTTP server
/////////////////////////////////////////////////////////

// Handle 404 after all other routes have been defined
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

server.listen(PORT, () => {
  logBlue(`🎉 Express initialized: http://${ipAddr}:${PORT}`);
});
