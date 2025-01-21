import AppStoreElement from "./app-store-element.js";

class AppStoreNumber extends AppStoreElement {
  initStoreListener() {
    this.input = this.el.querySelector("input");
    this.input.addEventListener("input", (e) => {
      _store.set(this.storeKey, parseFloat(e.target.value), true);
    });
    this.input.value = _store.get(this.storeKey) || parseFloat(this.storeValue);

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
      <label>${this.storeKey}</label>
      <input type="number" >
    `;
  }

  static register() {
    customElements.define("app-store-number", AppStoreNumber);
  }
}

AppStoreNumber.register();

export default AppStoreNumber;
