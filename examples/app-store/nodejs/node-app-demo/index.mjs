import { appStoreInit } from "../../../../src/server/util.mjs";

class AppStoreDemo {
  constructor() {
    // request all hydration keys with "*" or specific keys with an array ["app_state"]
    // callback fires once the server sends persistent_state over the websocket on connect
    this.appStore = appStoreInit("node_app_demo", "*", () => {
      this.onSocketConnected();
      this.addListeners(); // wait for hydration to complete so we don't get callbacks for the initial state
      this.startHeartbeat();
      // do something with specific keys to reflect app state?
      console.log("AppStore state:");
      this.appStore.log();
    });
  }

  onSocketConnected() {
    console.log("AppStore connected and hydrated, ready to broadcast updates");
  }

  addListeners() {
    this.appStore.addListener(this); // listen to all updates: calls storeUpdated() for all keys
    this.appStore.addListener(this, "appstore_connected"); // respond to successful connection
    this.appStore.addListener(this, "slider_1"); // listen to a specific key
  }

  storeUpdated(key, value) {
    console.log("AppStore updated:", key, value);
  }

  appstore_connected(val) {
    this.onSocketConnected();
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
