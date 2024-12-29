import MobileUtil from "../../shared/js/haxademic.js/mobile-util.mjs";
import ErrorUtil from "../../shared/js/haxademic.js/error-util.mjs";

// Import to trigger self-executing register() functions inside the component classes
import "../../shared/js/haxademic.js/components/app-store-element.js";
import "../../shared/js/haxademic.js/components/app-store-button.js";
import "../../shared/js/haxademic.js/components/app-store-heartbeat.js";
import "../../shared/js/haxademic.js/components/app-store-textfield.js";
import "../../shared/js/haxademic.js/components/app-store-slider.js";
import "../../shared/js/haxademic.js/components/app-store-init.js";
import "../../shared/js/haxademic.js/components/event-log-table.js";
import "../../shared/js/haxademic.js/components/app-store-table.js";
import "../../shared/js/haxademic.js/components/app-store-clients.js";

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
  }

  populateHeaderLinks() {
    // set server url right header links
    // these values are populated in AppStoreInit
    let wsURL = _store.get("ws_url");
    let serverURL = _store.get("server_url");

    // populate header links with server URL
    document
      .querySelector("a[data-state-url]")
      .setAttribute("href", `${serverURL}state`);
    document
      .querySelector("a[data-clients-url]")
      .setAttribute("href", `${serverURL}clients`);

    // server url in header
    let headerServerUrl = document.querySelector(
      "a[data-server-address-display]"
    );
    headerServerUrl.innerHTML = serverURL; // `${document.location.hostname}:${document.location.port}`;
    headerServerUrl.removeAttribute("aria-busy");
    headerServerUrl.setAttribute("href", serverURL);
  }

  storeUpdated(key, value) {
    // console.log(key, value);
    if (key == "server_url") {
      console.log(key, "=", value);
      // set server url right header links
    }
  }

  init() {
    ErrorUtil.initErrorCatching();
    MobileUtil.enablePseudoStyles();
  }
}

customElements.define("custom-app", CustomApp);
