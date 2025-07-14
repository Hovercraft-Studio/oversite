import AppStoreElement from "./app-store-element.js";

class AppStoreTextfield extends AppStoreElement {
  initStoreListener() {
    this.input = this.el.querySelector("input");

    this.input.value = this.storeValue || "";

    this.input.addEventListener("input", (e) => {
      _store.set(this.storeKey, e.target.value, true);
    });

    super.initStoreListener();
  }

  setStoreValue(value) {
    this.input.value = value;
  }

  css() {
    return /*css*/ ``;
  }

  html() {
    return /*html*/ `
      <input type="text" placeholder="Text here" >
    `;
  }

  static register() {
    customElements.define("app-store-textfield", AppStoreTextfield);
  }
}

AppStoreTextfield.register();

export default AppStoreTextfield;
