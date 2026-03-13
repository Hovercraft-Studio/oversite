import AppStore from "../../app-store/app-store-.mjs";

class AppStoreElement extends HTMLElement {
  static observedAttributes = ["disabled"];

  connectedCallback() {
    // this.shadow = this.attachShadow({ mode: "open" }); // "open" allows querying and lots more
    this.el = this.shadow ? this.shadow : this;
    this.initialHTML = this.innerHTML;
    this.initComponent();
    AppStore.checkStoreReady(this);
    this.render();
  }

  disconnectedCallback() {
    _store?.removeListener(this);
  }

  initComponent() {
    // determine store key and value from attributes
    const rawKey = this.getAttribute("key") ?? this.getAttribute("store-key");
    this.storeKey = rawKey ? String(rawKey) : "key";
    const rawValue = this.getAttribute("value") ?? this.getAttribute("store-value");
    this.storeValue = rawValue ? String(rawValue) : null;
    this.coerceBooleanValues();
    this.valueFromStore = null; // track the current value from the store to prevent unnecessary updates

    this.flashOnUpdate = this.hasAttribute("flash-on-update");
  }

  coerceBooleanValues() {
    if (this.storeValue == "true") this.storeValue = true;
    else if (this.storeValue == "false") this.storeValue = false;
    else if (this.storeValue == "0") this.storeValue = 0;
    else if (this.storeValue == "1") this.storeValue = 1;
    else if (this.storeValue == "-1") this.storeValue = -1;
  }

  subclassInit() {
    // stub to override with subclass-specific initialization
  }

  storeIsReady() {
    this.subclassInit();
    this.valueFromStore = _store.get(this.storeKey) || this.valueFromStore;
    _store.addListener(this);
    this.hydrateOnInit();
  }

  hydrateOnInit() {
    // if the store has a value, set it. if the web component existed as the page loaded,
    // this most likely is a result of app-store-init checking the server for hydration keys
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

  // Manually handle observed attributes after any render
  handleObservedAttributes() {
    this.handleDisabledChange(this.hasAttribute("disabled"));
  }

  handleDisabledChange(isDisabled) {
    if (!this.el) return;

    // update the disabled state of all interactive child elements
    this.el.querySelectorAll("input, button, select, textarea").forEach((element) => {
      element.disabled = isDisabled;
    });

    // update the aria-disabled attribute on child labels
    this.el.querySelectorAll("label").forEach((label) => {
      label.setAttribute("aria-disabled", isDisabled);
    });
  }

  /////////////////////////////////////////////////////////
  // CSS & Rendering
  /////////////////////////////////////////////////////////

  /**
   * Injects this component's CSS into a single <style> tag in <head>,
   * keyed by tag name. Subsequent instances of the same component reuse
   * the existing <style> — one definition to edit in DevTools for all
   * instances. Shadow DOM components should skip this and inline styles
   * in their shadow root instead.
   *
   * Subclasses that use an imported shared CSS module can pass it as
   * `sharedCss` to colocate it in the same <style> tag.
   */
  injectHeadStyles(sharedCss = "") {
    const tagName = this.localName;
    const styleId = `style-${tagName}`;
    if (document.getElementById(styleId)) return;
    const cssText = (sharedCss + "\n" + this.css()).trim();
    if (!cssText) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.setAttribute("data-component", tagName);
    style.textContent = cssText;
    document.head.appendChild(style);
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
    this.el.innerHTML = this.html();
    this.injectHeadStyles();
    this.handleObservedAttributes();
  }

  static register() {
    customElements.define("app-store-element", AppStoreElement);
  }
}

AppStoreElement.register();

export default AppStoreElement;
