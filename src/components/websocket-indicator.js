import DOMUtil from "../util/dom-util.mjs";

class WebsocketIndicator extends HTMLElement {
  connectedCallback() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.observer = DOMUtil.observeCssClassChanges(this.updateIndicator.bind(this));
    this.render();
    this.div = this.shadow.querySelector("div");
    this.initClickListener();
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  initClickListener() {
    this.div.addEventListener("click", () => {
      _store.set("SHOW_DEBUG", !_store.get("SHOW_DEBUG"));
    });
  }

  updateIndicator(classList) {
    if (!this.div) return;
    if (classList.contains("no-socket")) {
      this.div.classList.add("no-socket");
    } else {
      this.div.classList.remove("no-socket");
    }
  }

  html() {
    return /*html*/ `
      <div></div>
    `;
  }

  css() {
    return /*css*/ `
      :host {
        z-index: 9999;
        position: absolute;
        top: 1rem;
        right: 1rem;
      }
      div {
        width: 20px; 
        height: 20px; 
        border-radius: 10px;
        background-color: #33ff33;
        cursor: pointer;
      }
      div.no-socket {
        background-color: #ff3333;
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

  static register() {
    customElements.define("websocket-indicator", WebsocketIndicator);
  }
}

WebsocketIndicator.register();

export default WebsocketIndicator;
