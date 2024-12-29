import ObjectUtil from "../object-util.mjs";

class AppStoreElement extends HTMLElement {
  connectedCallback() {
    // this.shadow = this.attachShadow({ mode: "open" }); // "open" allows querying and probably lots more
    this.el = this.shadow ? this.shadow : this;
    this.initComponent();
    this.render();
  }

  disconnectedCallback() {
    _store?.removeListener(this);
  }

  initComponent() {
    this.initialHTML = this.innerHTML;
    this.storeKey = String(this.getAttribute("key")) || "key";
    this.storeValue = String(this.getAttribute("value")) || "value";

    // handle special values to coerce datatypes
    if (this.storeValue == "true") this.storeValue = true;
    else if (this.storeValue == "false") this.storeValue = false;
    else if (this.storeValue == "0") this.storeValue = 0;
    else if (this.storeValue == "1") this.storeValue = 1;

    // AppStore connection when _store is available
    this.valueFromStore = null;
    ObjectUtil.callbackWhenPropertyExists(window, "_store", () => {
      this.initStoreListener();
    });
  }

  initStoreListener() {
    this.valueFromStore = _store.get(this.storeKey) || this.valueFromStore;
    _store.addListener(this);
    this.hydrateOnInit();
  }

  hydrateOnInit() {
    // if the store has a value, set it. if the web component existed as the page loaded,
    // this most likely is a result of app-store-init checking the server for hyrdation keys
    if (_store.get(this.storeKey) != null) {
      this.setStoreValue(_store.get(this.storeKey));
    }
  }

  storeUpdated(key, value) {
    if (key != this.storeKey) return; // ignore other keys
    if (value != this.valueFromStore) {
      this.valueFromStore = value;
      this.setStoreValue(value);
    }
  }

  setStoreValue(value) {
    this.el ? (this.el.innerHTML = value) : this.render();
  }

  css() {
    return /*css*/ `
    `;
  }

  html() {
    return /*html*/ `
      <div>${this.valueFromStore || this.initialHTML}</div>
    `;
  }

  render() {
    this.el.innerHTML = /*html*/ `
      ${this.html()}
      <style>
        ${this.css()}
      </style>
    `;
  }

  static register() {
    customElements.define("app-store-element", AppStoreElement);
  }
}

AppStoreElement.register();

export default AppStoreElement;
