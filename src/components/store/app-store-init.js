import AppStoreDistributed from "../../app-store/app-store-distributed.mjs";

/**
 * AppStoreInit - Web component that initializes AppStore distributed connection
 *
 * Attributes:
 * - sender: Identifies your app in the monitor (use lowercase with underscores)
 * - channel: WebSocket channel to connect to (default: "default")
 * - auth-key: Authentication key for the connection
 * - init-keys: Space-separated list of keys to hydrate from server's persistent_state on connect, or "*" for all keys
 * - debug: Shows debug interface in browser
 * - side-debug: Shows debug interface on side instead of bottom
 * - disable-favicon-status: Disables automatic favicon updates that show WebSocket connection status
 * - ws-url: Override the WebSocket URL (bypasses hash query configuration)
 */
class AppStoreInit extends HTMLElement {
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.initServerURL();
    this.initSharedState();
    this.addChildren();
  }

  hashParamConfig(key, defaultVal, writeToHash = true) {
    // use value from the URL hash if it exists, otherwise use default value and write to hash for the next reload
    let hashParams = new URLSearchParams(document.location.hash);
    let val = hashParams.has(key) ? hashParams.get(key) : defaultVal;
    if (!hashParams.has(key) && writeToHash) document.location.hash += `&${key}=${val}`;
    return val;
  }

  initServerURL() {
    // get ws:// URL from attribute if available and
    // override hash `this.hashParamConfig()` methods below if exists
    let wsURL = this.getAttribute("ws-url");

    // check dev port to detect if we're running locally or on a production server
    let isDev = wsURL ? wsURL.includes(":") : document.location.port.length > 0;
    let isProd = !isDev;

    // get address from querystring or use default
    // and show in URL for easy sharing
    let defaultWsURL = "ws://" + document.location.hostname + ":3003/ws";
    if (isProd) defaultWsURL = "wss://" + document.location.hostname + "/ws"; // production server
    this.webSocketURL = wsURL ? wsURL : this.hashParamConfig("wsURL", defaultWsURL);

    // transform ws:// URL into http server URL, since we have that address the store, and that's the same server!
    // we just need to check for a custom http port in the URL and otherwise use the ws:// address
    let socketToServerURL = new URL(this.webSocketURL);
    socketToServerURL.protocol = socketToServerURL.protocol == "ws:" ? "http:" : "https:"; // SSL if production websocket server
    socketToServerURL.search = ""; // remove querystring
    socketToServerURL.pathname = ""; // remove `/ws` path
    if (isProd) socketToServerURL.port = ""; // production server shouldn't have a port in the URL
    this.serverURL = socketToServerURL.href;
  }

  initSharedState() {
    // get config from web component attributes,
    // but if there are also values in the URL hash (set by hashParamConfig),
    // use those instead and write them to the hash for sharing
    let sender = this.getAttribute("sender");
    let senderFromHash = this.hashParamConfig("sender", null, false);
    if (senderFromHash) sender = senderFromHash;
    let channel = this.getAttribute("channel");
    let channelFromHash = this.hashParamConfig("channel", null, false);
    if (channelFromHash) channel = channelFromHash;

    let auth = this.getAttribute("auth");
    this.initKeys = this.getAttribute("init-keys");

    // connect to websocket server
    this.appStore = new AppStoreDistributed(this.webSocketURL, sender, channel, auth);

    // listen for data/events
    _store.addListener(this);
    _store.addListener(this, "appstore_connected"); // emitted by AppStoreDistributed when connected
    _store.addListener(this, "persistent_state"); // emitted by server on connect; used to hydrate local store

    // send out any local config
    _store.set("ws_url", this.webSocketURL);
    _store.set("server_url", this.serverURL);
  }

  isDebug() {
    return this.hasAttribute("debug");
  }

  addChildren() {
    let sideDebug = this.hasAttribute("side-debug") ? "side-debug" : "";
    let shouldShowFaviconStatus = !this.hasAttribute("disable-favicon-status");

    if (this.isDebug()) {
      this.shadow.innerHTML = /*html*/ `
        <websocket-indicator></websocket-indicator>
        ${shouldShowFaviconStatus ? "<favicon-status></favicon-status>" : ""}
        <app-store-debug ${sideDebug}></app-store-debug>
      `;
    } else {
      this.shadow.innerHTML = /*html*/ `
        <app-store-debug></app-store-debug>
      `;
    }
  }

  // AppStore listeners

  appstore_connected(val) {
    // _store.set("client_connected", Date.now(), true); // let desktop app know that we're here
    // _store.set("client_connected", this.appStore.senderId, true); // let desktop app know that we're here
  }

  persistent_state(stateData) {
    // hydrate local _store from server's persisted state, sent via WebSocket on connect
    if (!this.initKeys) return;
    const keys = this.initKeys.split(" ");
    // either 1) all keys
    if (keys.includes("*")) {
      Object.keys(stateData).forEach((key) => {
        _store.set(key, stateData[key].value, false);
      });
    }
    // or 2) specific keys that we've defined, making sure they're in the server store before saving locally
    else {
      keys.forEach((key) => {
        if (stateData[key]) _store.set(key, stateData[key].value, false);
      });
    }
    console.log("AppStoreInit hydrated local store with server state:", stateData);
  }

  storeUpdated(key, val) {}

  static register() {
    customElements.define("app-store-init", AppStoreInit);
  }
}

AppStoreInit.register();

export default AppStoreInit;
