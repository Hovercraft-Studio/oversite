import AppStoreElement from "./app-store-element.js";

class AppStoreIf extends AppStoreElement {
  render() {
    this.el.innerHTML = this.initialHTML;
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
    `;
  }

  static register() {
    customElements.define("app-store-if", AppStoreIf);
  }
}

AppStoreIf.register();

export default AppStoreIf;
