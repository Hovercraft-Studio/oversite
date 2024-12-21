import AppStoreDistributed from "../app-store-distributed.mjs";

// self-registering child components
import "./websocket-indicator.js";
import "./app-store-debug.js";
import URLUtil from "../url-util.mjs";
// import PointerPos from "../src/pointer-pos.js";

class AppStateDistributed extends HTMLElement {
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.initSharedState();
    this.addChildren();
  }

  initSharedState() {
    // get sender from web component attribute
    let sender = this.getAttribute("sender");

    // get address from querystring or use default
    // and show in URL for easy sharing
    let wsServerFromQuery = URLUtil.getHashQueryParam("server");
    this.webSocketHost = wsServerFromQuery;
    this.webSocketHost ??= "ws://" + document.location.hostname + ":3001/ws";
    if (!wsServerFromQuery)
      document.location.hash += `&server=${this.webSocketHost}`;

    // connect to websocket server
    this.appStore = new AppStoreDistributed(this.webSocketHost, sender);

    // listen for data/events
    _store.addListener(this);
    _store.addListener(this, "AppStoreDistributed_CONNECTED"); // emitted by AppStoreDistributed when connected
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

  AppStoreDistributed_CONNECTED(val) {
    _store.set("CLIENT_CONNECTED", Date.now(), true); // let desktop app know that we're here
  }

  storeUpdated(key, val) {}

  static register() {
    customElements.define("app-state-distributed", AppStateDistributed);
  }
}

AppStateDistributed.register();

export default AppStateDistributed;
