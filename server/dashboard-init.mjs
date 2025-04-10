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
        dashboardPath: "data/dashboard",
        dashboardApiRoute: "/dashboard",
      }
    : {
        dashboardPath: "data/dashboard", // relative to script
        dashboardApiRoute: "/dashboard",
      };

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
