import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import DashboardApi from "./dashboard-api.mjs";

const app = express();
const expressPort = 3005; // can't share httpPort; // Choose a port different from httpPort
app.listen(expressPort, () => {
  let ipAddr = "localhost";
  console.log(`Express server is running on http://${ipAddr}:${expressPort}`);
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config =
  process.env.NODE_ENV === "production"
    ? {
        dashboardPath: "/var/data/dashboard",
        dashboardApiRoute: "/secret/dashboard",
      }
    : {
        dashboardPath: "dashboard/data", // relative to project root
        dashboardApiRoute: "/dashboard",
      };

// fix headers on media files?
// app.use(express.static("public"));

// dashboard init
// get project root path on disk
// dev is local to the project but prod location could be a mapped drive, so we provide a full path
let dashboardDataPath = config.isProduction ? config.dashboardPath : path.join(__dirname, config.dashboardPath);
let dashboardConfig = {
  app,
  express,
  dashboardDataPath, // dashboard/data
  dashboardApiRoute: config.dashboardApiRoute, // /dashboard
};
const dashboardApi = new DashboardApi(dashboardConfig);
