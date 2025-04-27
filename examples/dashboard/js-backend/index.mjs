import AppStoreDistributed from "../../../src/app-store/app-store-distributed.mjs";
import { getCliArg, wsUrlToServerUrl } from "../../../src/server/util.mjs";
import DashboardPoster from "../../../src/dashboard/dashboard-poster.mjs";

class DashboardDemo {
  constructor() {
    this.config();
    this.appStore = new AppStoreDistributed(`${this.wsURL}`, "node_dashboard_example");
    this.addListeners();
    this.dashboardPoster = new DashboardPoster(`${this.serverURL}api/dashboard`, "node-app", "Test Node App", 5 * 1000);
  }

  config() {
    // find ws:// server in args
    this.wsURL = `${getCliArg("--server", "ws://127.0.0.1:3003/ws")}`; // need to use 127.0.0.1 instead of localhost!
    this.serverURL = wsUrlToServerUrl(this.wsURL);
  }

  addListeners() {
    this.appStore.addListener(this); // calls storeUpdated() for all updates
  }

  storeUpdated(key, value) {
    // console.log("AppStore updated:", key, value);
  }
}

new DashboardDemo();
