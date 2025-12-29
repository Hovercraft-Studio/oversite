// example of building an example backend app using the installed `oversite` npm module
import { appStoreInit } from "oversite/src/server/util.mjs"; // ../../../src

class AppStoreDemo {
  constructor() {
    setTimeout(() => this.init(), 1000); // slight delay to allow other servers to start first
  }

  init() {
    // request all hydration keys with "*" or specific keys with an array ["app_state"]
    this.appStore = appStoreInit("node_photo_app", "*", () => {
      if (this.appStore.isConnected()) this.onSocketConnected("hydrated");
      this.addListeners(); // wait for hydration to complete so we don't get callbacks for the initial state
      this.startHeartbeat();
      this.initApp();
    });
  }

  initApp() {
    // create custom components here
  }

  onSocketConnected(initSource) {
    console.log("AppStore connected, ready to broadcast updates:", initSource);
  }

  addListeners() {
    this.appStore.addListener(this, "appstore_connected"); // respond to successful connection
  }

  appstore_connected(val) {
    this.onSocketConnected("socket connected");
  }

  startHeartbeat() {
    this.startTime = Date.now();
    setInterval(() => {
      const uptimeSeconds = Date.now() - this.startTime;
      this.appStore.set("node_app_heartbeat", uptimeSeconds, true);
    }, 15000);
  }
}

new AppStoreDemo();
