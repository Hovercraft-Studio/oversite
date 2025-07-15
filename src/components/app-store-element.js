import ObjectUtil from "../util/object-util.mjs";

class AppStoreElement extends HTMLElement {
  static observedAttributes = ["disabled"];

  connectedCallback() {
    // this.shadow = this.attachShadow({ mode: "open" }); // "open" allows querying and probably lots more
    this.el = this.shadow ? this.shadow : this;
    this.initComponent();
    this.render();
    this.initObservedAttributes();
  }

  disconnectedCallback() {
    _store?.removeListener(this);
  }

  initComponent() {
    this.initialHTML = this.innerHTML;

    const rawKey = this.getAttribute("key") ?? this.getAttribute("store-key");
    this.storeKey = rawKey ? String(rawKey) : "key";

    const rawValue =
      this.getAttribute("value") ?? this.getAttribute("store-value");
    this.storeValue = rawValue ? String(rawValue) : "value";

    this.flashOnUpdate = this.hasAttribute("flash-on-update");

    // handle special values to coerce datatypes
    if (this.storeValue == "true") this.storeValue = true;
    else if (this.storeValue == "false") this.storeValue = false;
    else if (this.storeValue == "0") this.storeValue = 0;
    else if (this.storeValue == "1") this.storeValue = 1;
    else if (this.storeValue == "-1") this.storeValue = -1;

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
      if (this.flashOnUpdate) this.flashBg();
    }
  }

  setStoreValue(value) {
    this.el ? (this.el.innerHTML = value) : this.render();
  }

  flashBg() {
    window.clearTimeout(this.timeout1);
    window.clearTimeout(this.timeout2);
    this.el.classList.remove("flash");
    this.timeout1 = setTimeout(() => {
      this.el.classList.add("flash");
    }, 50);
    this.timeout2 = setTimeout(() => {
      this.el.classList.remove("flash");
    }, 1010);
  }

  // Add attribute listeners and handlers here
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "disabled") this.handleDisabledChange(newValue !== null);
  }

  // Add attribute handlers for the initial render
  initObservedAttributes() {
    this.handleDisabledChange(this.hasAttribute("disabled"));
  }

  handleDisabledChange(isDisabled) {
    if (!this.el) return;

    // update the disabled state of all interactive child elements
    this.el
      .querySelectorAll("input, button, select, textarea")
      .forEach((element) => {
        element.disabled = isDisabled;
      });

    // update the aria-disabled attribute on child labels
    this.el.querySelectorAll("label").forEach((label) => {
      label.setAttribute("aria-disabled", isDisabled);
    });
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
