import AppStoreElement from "./app-store-element.js";

/**
 * AppStoreCheckbox - A checkbox component with two-way data binding to the app store.
 * Add the "toggle" attribute to make it behave as a toggle switch.
 *
 * Usage:
 *   Basic checkbox: <app-store-checkbox store-key="myCheckbox">Enable feature</app-store-checkbox>
 *   Toggle switch: <app-store-checkbox store-key="myToggle" toggle>Dark mode</app-store-checkbox>
 */
class AppStoreCheckbox extends AppStoreElement {
  initStoreListener() {
    this.input = this.el.querySelector("input");

    // Set initial checked state from attribute value; will be overridden by store value if it exists
    this.input.checked =
      this.storeValue === true || parseInt(this.storeValue) === 1;

    this.isToggle = this.hasAttribute("toggle");
    if (this.isToggle) this.input.setAttribute("role", "switch");

    this.input.addEventListener("change", (e) => {
      _store.set(this.storeKey, e.target.checked, true);
    });

    super.initStoreListener();
  }

  setStoreValue(value) {
    this.input.checked = value === true || parseInt(value) === 1;
  }

  css() {
    return /*css*/ ``;
  }

  html() {
    return /*html*/ `
      <label>
        <input type="checkbox" />
        ${this.initialHTML}
      </label>
    `;
  }

  static register() {
    customElements.define("app-store-checkbox", AppStoreCheckbox);
  }
}

AppStoreCheckbox.register();

export default AppStoreCheckbox;
