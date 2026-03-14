class AppStoreDebug extends HTMLElement {
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    _store.addListener(this);
    this.render();
    this.div = this.shadow.querySelector("div");
    this.initKeyListener();
    this.showing = false;
    _store.set("SHOW_DEBUG", false);
  }

  formatValue(key, val) {
    if (val === null || val === undefined) return String(val);
    if (Array.isArray(val)) {
      if (key === "clients") return val.map((client) => client.sender).join("<br>");
      return `Array(${val.length})`;
    }
    if (typeof val === "object") return `Object(${Object.keys(val).length} keys)`;
    if (typeof val === "string" && val.length > 100) return `${val.substring(0, 100)}...`;
    return val;
  }

  html() {
    let keys = Object.keys(_store.state).sort();
    let htmlStr = "<table>";
    keys.forEach((key) => {
      htmlStr += `<tr><td>${key}</td><td>${this.formatValue(key, _store.state[key])}</td></tr>`;
    });
    htmlStr += "</table>";
    return htmlStr;
  }

  css() {
    let isSideDisplay = this.hasAttribute("side-debug");
    let sideCSS = isSideDisplay
      ? /*css*/ `
        top: 0; 
        left: 0;
        width: auto; 
        height: 100%; 
        max-width: 70%;
        border-top: none;
        border-right: 2px solid green;
      `
      : "";
    return /*css*/ `
      :host {
        box-sizing: border-box;
        border-top: 2px solid green;
        position: fixed;
        bottom: 0;
        left: 0;
        padding: 1rem;
        width: 100%; 
        background: rgba(0,0,0,0.8);
        color: #fff;
        overflow-y: auto;
        font-family: arial;
        font-size: 12px;
        z-index: 9999;
        display: none;
        ${sideCSS}
      }
      table {
        border-collapse: collapse;
        border-spacing: 0;
      }
      td {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.5rem;
      }
      tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.4);
      }
    `;
  }

  render() {
    this.shadow.innerHTML = /*html*/ `
      ${this.html()}
      <style>
        ${this.css()}
      </style>
    `;
  }

  initKeyListener() {
    window.addEventListener("keyup", (e) => {
      let notFocused = document.activeElement.tagName != "INPUT"; // e.target.tagName != "INPUT"
      if (e.key == "/" && notFocused) {
        this.showing = !this.showing;
        _store.set("SHOW_DEBUG", this.showing);
        if (this.showing == false) {
          this.hide();
        } else {
          this.show();
        }
      }
    });
  }

  storeUpdated(key, value) {
    if (key == "SHOW_DEBUG") {
      value ? this.show() : this.hide();
      return;
    }
    if (!this.showing) return;
    clearTimeout(this.renderDebounce);
    this.renderDebounce = setTimeout(() => this.render(), 50);
  }

  show() {
    this.render();
    this.style.display = "block";
  }

  hide() {
    this.innerHTML = "";
    this.style.display = "none";
    this.showing = false;
  }

  static register() {
    customElements.define("app-store-debug", AppStoreDebug);
  }
}

AppStoreDebug.register();

export default AppStoreDebug;
