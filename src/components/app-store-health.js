import AppStoreElement from "./app-store-element.js";

class AppStoreHealth extends AppStoreElement {
  initStoreListener() {
    super.initStoreListener();
  }

  setStoreValue(value) {
    this.render();
  }

  css() {
    return /*css*/ `
      app-store-health {
        span {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: #ffff00;
          vertical-align: bottom;
        }
        span.healthy {
            background: #00ff00;
          }
          
        span.unhealthy {
            background: #ff0000;
          }
        }
      }
    `;
  }

  html() {
    let result = `<span title="No data yet"></span>`;
    if (
      this.valueFromStore == true ||
      this.valueFromStore == "true" ||
      this.valueFromStore == "1" ||
      this.valueFromStore == 1
    ) {
      result = `<span class="healthy"></span>`;
    } else if (
      this.valueFromStore == false ||
      this.valueFromStore == "false" ||
      this.valueFromStore == "0" ||
      this.valueFromStore == 0
    ) {
      result = `<span class="unhealthy"></span>`;
    }
    return /*html*/ `
      <code>${this.storeKey} ${result}</code>
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
    customElements.define("app-store-health", AppStoreHealth);
  }
}

AppStoreHealth.register();

export default AppStoreHealth;
