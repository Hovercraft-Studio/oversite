import MobileUtil from "../../shared/js/haxademic.js/mobile-util.mjs";
import ErrorUtil from "../../shared/js/haxademic.js/error-util.mjs";

// Import to trigger self-executing register() functions inside the component classes
import "../../shared/js/haxademic.js/components/app-store-element.js";
import "../../shared/js/haxademic.js/components/app-store-button.js";
import "../../shared/js/haxademic.js/components/app-store-textfield.js";
import "../../shared/js/haxademic.js/components/app-store-slider.js";
import "../../shared/js/haxademic.js/components/app-state-distributed.js";
import "../../shared/js/haxademic.js/components/event-log-view.js";

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

  // poll for /server/ updates
  startTablePoll() {
    setInterval(async () => {
      let res = await fetch("/server/state");
      let data = await res.json();
      console.log(data);
    }, 1000);
  }
}

customElements.define("custom-app", CustomApp);
