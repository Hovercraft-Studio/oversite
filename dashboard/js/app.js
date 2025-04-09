import MobileUtil from "../../shared/js/haxademic.js/mobile-util.mjs";
import ErrorUtil from "../../shared/js/haxademic.js/error-util.mjs";

// import web components
import DashboardView from "./dashboard-view";

class CustomApp extends HTMLElement {
  connectedCallback() {
    this.init();
    _store.addListener(this);
  }

  storeUpdated(key, value) {
    // console.log(key, value);
  }

  init() {
    ErrorUtil.initErrorCatching();
    MobileUtil.enablePseudoStyles();
  }
}

customElements.define("custom-app", CustomApp);
