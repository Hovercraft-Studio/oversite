import ErrorUtil from "../../../../shared/js/haxademic.js/error-util.mjs";
import "./dashboard-client-example-component.js";
import "../../../../dashboard/js/dashboard-view.js";

class CustomApp extends HTMLElement {
  connectedCallback() {
    this.init();
  }

  init() {
    ErrorUtil.initErrorCatching();
    if (_store) _store.addListener(this);
  }

  storeUpdated(key, value) {
    // console.log(key, value);
  }
}

customElements.define("custom-app", CustomApp);
