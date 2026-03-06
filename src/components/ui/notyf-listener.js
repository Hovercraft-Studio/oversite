import AppStore from "../../app-store/app-store-.mjs";
import { Notyf } from "notyf";
import "notyf/notyf.min.css"; // for Vite, React, Vue and Svelte

class NotyfListener extends HTMLElement {
  static TOAST = "toast";
  static TOAST_ERROR = "toast_error";

  connectedCallback() {
    // listen for notyf events
    this.notyf = new Notyf({ duration: 4000 });
    AppStore.checkStoreReady(this);
  }

  storeIsReady() {
    _store.addListener(this, NotyfListener.TOAST);
    _store.addListener(this, NotyfListener.TOAST_ERROR);
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
