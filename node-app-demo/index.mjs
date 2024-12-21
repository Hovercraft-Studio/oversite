import AppStoreDistributed from "../js/haxademic.js/app-store-distributed.mjs";

class AppStoreDemo {
  constructor() {
    this.config();
    this.appStore = new AppStoreDistributed(`ws://${this.wsURL}`, "NODE_DEMO");
    this.addListeners();
    this.startHeartbeat();
  }

  config() {
    // find ws:// server in args
    // need to use 127.0.0.1 instead of localhost!
    const args = process.argv.slice(2);
    const serverIndex = args.indexOf("--server");
    const nextArg = args[serverIndex + 1];
    this.wsURL = serverIndex != -1 ? nextArg : "127.0.0.1:3001/ws";
  }

  addListeners() {
    // listen to all updates
    this.appStore.addListener(this); // calls storeUpdated() for all updates
    // listen to a specific key
    this.appStore.addListener(this, "SLIDER_1");
  }

  storeUpdated(key, value) {
    console.log("AppStore updated:", key, value);
  }

  SLIDER_1(value) {
    console.log("SLIDER_1 updated:", value);
  }

  startHeartbeat() {
    setInterval(() => {
      this.appStore.set("NODE_APP_HEARTBEAT", new Date().getTime(), true);
    }, 5000);
  }
}

new AppStoreDemo();
