import MobileUtil from "../../src/util/mobile-util.mjs";
import ErrorUtil from "../../src/util/error-util.mjs";
import PicoTheme from "../../src/util/pico-theme.js";

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

    // Apply custom Pico theme with extra named color groups
    PicoTheme.apply(
      {
        primary: "#6366f1", // indigo
        secondary: "#475569", // slate
        contrast: "#0f172a", // near-black
        extras: {
          warm: "#f59e0b", // amber — for special buttons
          cool: "#06b6d4", // cyan — for input fields
          earth: "#65a30d", // lime — for compound/monitoring
        },
      },
      this,
    );
  }
}

customElements.define("custom-app", CustomApp);
