import AppStoreDistributed from "../app-store/app-store-distributed.mjs";
import URLUtil from "../util/url-util.mjs";

/**
 * AppStoreInit - Web component that initializes AppStore distributed connection
 *
 * Attributes:
 * - sender: Identifies your app in the monitor (use lowercase with underscores)
 * - channel: WebSocket channel to connect to (default: "default")
 * - auth-key: Authentication key for the connection
 * - init-keys: Space-separated list of keys to retrieve on connection, or "*" for all keys
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

  initServerURL() {
    // get ws:// URL from attribute if available and
    // override hash `URLUtil.hashParamConfig()` methods below if exists
    let wsURL = this.getAttribute("ws-url");

    // check dev port to detect if we're running locally or on a production server
    let isDev = wsURL ? wsURL.includes(":") : document.location.port.length > 0;
    let isProd = !isDev;

    // get address from querystring or use default
    // and show in URL for easy sharing
    let defaultWsURL = "ws://" + document.location.hostname + ":3003/ws";
    if (isProd) defaultWsURL = "wss://" + document.location.hostname + "/ws"; // production server
    this.webSocketURL = wsURL
      ? wsURL
      : URLUtil.hashParamConfig("wsURL", defaultWsURL);

    // transform ws:// URL into http server URL, since we have that address the store, and that's the same server!
    // we just need to check for a custom http port in the URL and otherwise use the ws:// address
    let socketToServerURL = new URL(this.webSocketURL);
    socketToServerURL.protocol =
      socketToServerURL.protocol == "ws:" ? "http:" : "https:"; // SSL if production websocket server
    socketToServerURL.search = ""; // remove querystring
    socketToServerURL.pathname = ""; // remove `/ws` path
    if (isProd) socketToServerURL.port = ""; // production server shouldn't have a port in the URL
    this.serverURL = socketToServerURL.href;
  }

  async initSharedState() {
    // get config from web component attributes
    let sender = this.getAttribute("sender");
    let channel = this.getAttribute("channel");
    let auth = this.getAttribute("auth");
    let initKeys = this.getAttribute("init-keys");

    // connect to websocket server
    this.appStore = new AppStoreDistributed(
      this.webSocketURL,
      sender,
      channel,
      auth
    );

    // hydrate with specified keys
    this.hydrateOnInit(initKeys);

    // listen for data/events
    _store.addListener(this);
    _store.addListener(this, "appstore_connected"); // emitted by AppStoreDistributed when connected

    // send out any local config
    _store.set("ws_url", this.webSocketURL);
    _store.set("server_url", this.serverURL);
  }

  async hydrateOnInit(initKeys) {
    // hydrate with specified keys, and if found in the server state
    // set on local _store without broadcasting
    if (initKeys) {
      initKeys = initKeys.split(" ");
      if (initKeys.length > 0) {
        try {
          // get data from server
          const response = await fetch(`${this.serverURL}api/state/all`);
          if (!response.ok) {
            throw new Error(
              `Server error: ${response.status} ${response.statusText}`
            );
          }
          const data = await response.json();
          // set local _store values based on which were requested
          // either 1) all keys
          if (initKeys.includes("*")) {
            Object.keys(data).forEach((key) => {
              _store.set(key, data[key].value, false);
            });
          }
          // or 2) specific keys that we've defined, making sure they're in the server store before saving locally
          else {
            initKeys.forEach((key) => {
              if (data[key]) {
                _store.set(key, data[key].value, false);
              }
            });
          }
        } catch (error) {
          console.error("Failed to fetch data:", error);
        }
      }
    }
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
        ${shouldShowFaviconStatus ? "<favicon-status></favicon-status>" : ""}
        <app-store-debug></app-store-debug>
      `;
    }
  }

  // AppStore listeners

  appstore_connected(val) {
    // _store.set("client_connected", Date.now(), true); // let desktop app know that we're here
    // _store.set("client_connected", this.appStore.senderId, true); // let desktop app know that we're here
  }

  storeUpdated(key, val) {}

  static register() {
    customElements.define("app-store-init", AppStoreInit);
  }
}

AppStoreInit.register();

export default AppStoreInit;
