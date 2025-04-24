import MobileUtil from "../../src/util/mobile-util.mjs";
import ErrorUtil from "../../src/util/error-util.mjs";

// custom web components
// anything here?

class CustomApp extends HTMLElement {
  connectedCallback() {
    this.init();
    _store.addListener(this);
    _store.addListener(this, "appstore_connected"); // listen for appStore to connect
  }

  appstore_connected(value) {
    this.populateHeaderLinks();
    this.buildZoomButtons();
  }

  populateHeaderLinks() {
    // set server url right header links
    // these values are populated in AppStoreInit
    let wsURL = _store.get("ws_url");
    let serverURL = _store.get("server_url");

    // populate header links with server URL
    document.querySelector("a[data-state-url]").setAttribute("href", `${serverURL}api/state/all`);
    document.querySelector("a[data-clients-url]").setAttribute("href", `${serverURL}api/state/clients`);
    document.querySelector("a[data-wipe-url]").setAttribute("href", `${serverURL}api/state/wipe`);

    // server url in header
    let headerServerUrl = document.querySelector("a[data-server-address-display]");
    headerServerUrl.innerHTML = serverURL; // `${document.location.hostname}:${document.location.port}`;
    headerServerUrl.removeAttribute("aria-busy");
    headerServerUrl.setAttribute("href", serverURL);
  }

  buildZoomButtons() {
    this.root = document.documentElement;
    this.zoomInButton = document.querySelector("[data-zoom-in]");
    this.zoomOutButton = document.querySelector("[data-zoom-out]");
    this.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-zoom-in")) {
        e.preventDefault();
        const currentSize = this.getFontSize();
        this.setFontSize(currentSize + 0.05);
      }
      if (e.target.hasAttribute("data-zoom-out")) {
        const currentSize = this.getFontSize();
        this.setFontSize(currentSize - 0.05);
      }
    });
  }

  getFontSize() {
    return parseFloat(getComputedStyle(this.root).getPropertyValue("--table-font-size"));
  }

  setFontSize(size) {
    this.root.style.setProperty("--table-font-size", `${size}vw`);
  }

  storeUpdated(key, value) {
    // console.log(key, value);
    if (key == "server_url") {
      // console.log(key, "=", value);
      // set server url right header links
    }
    if (key == "client_connected") {
      _store.set("toast", `🤗 Client joined: ${value}`);
    }
    if (key == "client_disconnected") {
      _store.set("toast", `👋 Client left: ${value}`);
    }
  }

  init() {
    ErrorUtil.initErrorCatching();
    MobileUtil.enablePseudoStyles();
  }
}

customElements.define("custom-app", CustomApp);
