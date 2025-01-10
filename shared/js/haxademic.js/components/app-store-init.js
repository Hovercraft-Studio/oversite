import AppStoreDistributed from "../app-store-distributed.mjs";

// self-registering child components
import "./websocket-indicator.js";
import "./app-store-debug.js";

class AppStoreInit extends HTMLElement {
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.initServerURL();
    this.initSharedState();
    this.addChildren();
  }

  initServerURL() {
    // get any config from URL hash
    // we'll write to the hash to make it easy to share
    let hashParams = new URLSearchParams(document.location.hash);

    // get address from querystring or use default
    // and show in URL for easy sharing
    let wsServerFromQuery = hashParams.get("wsURL");
    this.webSocketURL = wsServerFromQuery;
    this.webSocketURL ??= "ws://" + document.location.hostname + ":3001/ws"; // use webpage address to calculate default websocket address
    if (!wsServerFromQuery) {
      // write server to hash if not already there
      document.location.hash += `&wsURL=${this.webSocketURL}`;
    }

    // transform ws:// URL into http server URL, since we have that address the store, and that's the same server!
    // we just need to check for a custom http port in the URL and otherwise use the ws:// address
    let socketURL = new URL(this.webSocketURL);
    socketURL.protocol = "http:";
    socketURL.search = "";
    socketURL.pathname = "";
    if (document.location.hash.includes("httpPort")) {
      socketURL.port = hashParams.get("httpPort"); // use port from the URL if exists
    } else {
      socketURL.port = 3003; // use default server port and write to hash
      document.location.hash += `&httpPort=${socketURL.port}`;
    }
    this.serverURL = socketURL.href;
  }

  async initSharedState() {
    // get config from web component attributes
    let sender = this.getAttribute("sender");
    let initKeys = this.getAttribute("init-keys");

    // connect to websocket server
    this.appStore = new AppStoreDistributed(this.webSocketURL, sender);

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
          const response = await fetch(`${this.serverURL}state`);
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
    this.shadow.innerHTML = this.isDebug()
      ? /*html*/ `
        <websocket-indicator></websocket-indicator>
        <app-store-debug ${sideDebug}></app-store-debug>
      `
      : /*html*/ `
        <app-store-debug></app-store-debug>
      `;
  }

  // AppStore listeners

  appstore_connected(val) {
    _store.set("client_connected", Date.now(), true); // let desktop app know that we're here
  }

  storeUpdated(key, val) {}

  static register() {
    customElements.define("app-store-init", AppStoreInit);
  }
}

AppStoreInit.register();

export default AppStoreInit;
