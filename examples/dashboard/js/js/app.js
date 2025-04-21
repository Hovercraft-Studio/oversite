import ErrorUtil from "../../../../src/util/error-util.mjs";

class CustomApp extends HTMLElement {
  connectedCallback() {
    this.init();
  }

  init() {
    ErrorUtil.initErrorCatching();
    if (_store) _store.addListener(this);
    this.initDashboardView();
  }

  initDashboardView() {
    let apiServerURL = _store.get("server_url") + "api/dashboard";
    let serverBase = _store.get("server_url").substring(0, _store.get("server_url").length - 1); // remove trailing slash
    this.querySelector("#dashboard-container").innerHTML = `
      <dashboard-view 
        api-url="${apiServerURL}" 
        server-base="${serverBase}" 
        refresh-interval="5"
      ></dashboard-view>
    `;
  }

  storeUpdated(key, value) {
    // console.log(key, value);
  }
}

customElements.define("custom-app", CustomApp);
