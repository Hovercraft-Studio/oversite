// import tools
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getValueFromArgs, ipAddr, eventLog } from "./util.mjs";

// get relative path to this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDataPath = join(__dirname, "data");

// get config from cli args
const args = process.argv.slice(2);
const wssPort = getValueFromArgs("--port", 3001);
const httpPort = getValueFromArgs("--portHttp", 3003);
const debug = args.indexOf("--debug") != -1;

// store config
const config = {
  dashboardPath: join(baseDataPath, "dashboard"),
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

eventLog(
  `Config:`,
  `Node env: ${process.env.NODE_ENV}`,
  `Base data path: ${baseDataPath}`,
  `Dashboard path: ${config.dashboardPath}`,
  `Dashboard API route: ${config.dashboardApiRoute}`,
  `Local ip address: ${ipAddr}`,
  `WebSocket server at ws://localhost:${wssPort}/ws`,
  `HTTP/Express server at http://${ipAddr}:${httpPort}`
);

// import web server tools
import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
const app = express();
const wsServer = new WebSocketServer({
  port: wssPort,
  host: "0.0.0.0", // allows connections from localhost and IP addresses
  path: "/ws",
}); // For Heroku launch, remove `port`! Example server config here: https://github.com/heroku-examples/node-websockets

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Content-Type", "application/json");
  next();
});

// Build server components
import PersistentState from "./persistent-state.mjs";
import SocketServer from "./socket-server.mjs";
import DashboardApi from "./dashboard-api.mjs";
const persistentState = new PersistentState(wsServer, app, baseDataPath, "state");
const socketServer = new SocketServer(wsServer, app, persistentState, debug);
const dashboardApi = new DashboardApi({
  app,
  express,
  dashboardDataPath: config.dashboardPath,
  dashboardApiRoute: "/dashboard",
});
if (debug) dashboardApi.printConfig();

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Create HTTP server
const server = http.createServer(app);
server.listen(httpPort, () => {
  eventLog(`🎉 Express initialized: http://${ipAddr}:${httpPort}`);
});
