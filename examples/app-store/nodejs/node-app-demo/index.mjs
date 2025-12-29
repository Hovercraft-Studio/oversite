import { appStoreInit } from "../../../../src/server/util.mjs";

class AppStoreDemo {
  constructor() {
    // request all hydration keys with "*" or specific keys with an array ["app_state"]
    this.appStore = appStoreInit("node_app", "*", () => {
      // by default, it's likely that this.appStore.isConnected() is false
      // because hydration should finish before the websocket "appstore_connected" event is received
      // but! to be sure we're aware that the socket connection is ready, we listen to the "appstore_connected" event below
      // resulting in `onSocketConnected` being called only once when the app starts up
      if (this.appStore.isConnected()) this.onSocketConnected("hydrated");
      this.addListeners(); // wait for hydration to complete so we don't get callbacks for the initial state
      this.startHeartbeat();
      // do something with specific keys to reflect app state?
      console.log("AppStore state:");
      this.appStore.log();
    });
  }

  onSocketConnected(initSource) {
    console.log("AppStore connected, ready to broadcast updates:", initSource);
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
    this.onSocketConnected("socket connected");
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
