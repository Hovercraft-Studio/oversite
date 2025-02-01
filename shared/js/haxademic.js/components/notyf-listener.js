import ObjectUtil from "../object-util.mjs";
import { Notyf } from "notyf";
import "notyf/notyf.min.css"; // for Vite, React, Vue and Svelte

class NotyfListener extends HTMLElement {
  connectedCallback() {
    // listen for notyf events
    this.notyf = new Notyf({ duration: 4000 });
    ObjectUtil.callbackWhenPropertyExists(window, "_store", () => {
      this.initStoreListener();
    });
  }

  initStoreListener() {
    _store.addListener(this, "toast");
    _store.addListener(this, "toast_error");
  }

  toast(val) {
    this.notyf.success(val);
  }

  toast_error(val) {
    this.notyf.error(val);
  }

  static register() {
    customElements.define("notyf-listener", NotyfListener);
  }
}

NotyfListener.register();

export { NotyfListener };
