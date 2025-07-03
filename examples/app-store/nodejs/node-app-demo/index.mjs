import AppStoreDistributed from "../../../../src/app-store/app-store-distributed.mjs";
import { getCliArg } from "../../../../src/server/util.mjs";

class AppStoreDemo {
  constructor() {
    this.config();
    this.appStore = new AppStoreDistributed(`${this.wsURL}`, "node_app");
    this.addListeners();
    this.startHeartbeat();
  }

  config() {
    // find ws:// server in args
    this.wsURL = getCliArg("--server", "ws://127.0.0.1:3003/ws"); // need to use 127.0.0.1 instead of localhost!
    // get server http port
    this.serverPort = process.env.PORT ?? getCliArg("--port", 3003); // prod uses process.env.PORT, but dev uses --port arg
    // extrapolate http server from ws url and apply port
    let socketURL = new URL(this.wsURL);
    socketURL.protocol = "http:";
    socketURL.search = "";
    socketURL.pathname = "";
    socketURL.port = this.serverPort;
    this.serverURL = socketURL.href;

    // hydrate with specified keys
    this.hydrateOnInit(["user_id", "render_health", "render_status"]);
  }

  async hydrateOnInit(initKeys) {
    // hydrate with specified keys, and if found in the server state
    // set on local _store without broadcasting
    try {
      const response = await fetch(`${this.serverURL}api/state/all`);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      initKeys.forEach((key) => {
        if (data[key]) {
          console.log("hydrated", key, data[key].value);
          this.appStore.set(key, data[key].value, false);
        }
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  addListeners() {
    // listen to all updates
    this.appStore.addListener(this); // calls storeUpdated() for all updates
    // listen to a specific key
    this.appStore.addListener(this, "slider_1");
  }

  storeUpdated(key, value) {
    console.log("AppStore updated:", key, value);
  }

  slider_1(value) {
    console.log("slider_1 updated:", value);
  }

  startHeartbeat() {
    this.startTime = Date.now();
    setInterval(() => {
      const uptimeSeconds = Date.now() - this.startTime;
      this.appStore.set("node_app_heartbeat", uptimeSeconds, true);
    }, 5000);
  }
}

new AppStoreDemo();
