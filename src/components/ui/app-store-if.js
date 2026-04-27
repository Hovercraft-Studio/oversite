import AppStoreElement from "./app-store-element.js";

class AppStoreIf extends AppStoreElement {
  render() {
    this.el.setAttribute("hidden", "");
    this.injectHeadStyles();
  }

  setStoreValue(value) {
    this.el.toggleAttribute("hidden", String(value) !== String(this.storeValue));
  }

  css() {
    return /*css*/ `
      app-store-if[hidden] {
        display: none;
      }
      
      app-store-if[notification] {
        border: 1px solid var(--pico-contrast-background);
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 1rem;
        box-sizing: border-box;
        display: block;
      }
    `;
  }

  static register() {
    customElements.define("app-store-if", AppStoreIf);
  }
}

AppStoreIf.register();

export default AppStoreIf;
