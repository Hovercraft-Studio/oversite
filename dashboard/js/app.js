import MobileUtil from "../../shared/js/haxademic.js/mobile-util.mjs";
import ErrorUtil from "../../shared/js/haxademic.js/error-util.mjs";

// import web components
import DashboardView from "./dashboard-view";

class CustomApp extends HTMLElement {
  connectedCallback() {
    this.init();
    _store.addListener(this);
    this.initDashboardView();
  }

  initDashboardView() {
    let apiServerURL = _store.get("server_url") + "api/dashboard";
    this.querySelector("#dashboard-container").innerHTML = `
      <dashboard-view data-api-url="${apiServerURL}" refresh-interval="60"></dashboard-view>
    `;
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
