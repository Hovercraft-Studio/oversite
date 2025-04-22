import DOMUtil from "../util/dom-util.mjs";

class FaviconStatus extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    this.link = document.querySelector('link[rel*="shortcut icon"]');
    this.canvas = document.createElement("canvas");
    this.canvas.width = 16;
    this.canvas.height = 16;
    this.context = this.canvas.getContext("2d");
    this.observer = DOMUtil.observeCssClassChanges(this.updateFavicon.bind(this));
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  updateFavicon(classList) {
    if (classList.contains("no-socket")) {
      this.drawFavicon("#ff3333");
    } else if (classList.contains("has-socket")) {
      this.drawFavicon("#33ff33");
    } else {
      this.link.href = "/icon.png"; // reset to default favicon
    }
  }

  drawFavicon(color) {
    this.context.clearRect(0, 0, 16, 16);
    this.context.beginPath();
    this.context.fillStyle = color;
    this.context.arc(8, 8, 5, 0, 2 * Math.PI);
    this.context.fill();
    this.link.href = this.canvas.toDataURL("image/png"); // update favicon
  }

  static register() {
    customElements.define("favicon-status", FaviconStatus);
  }
}

FaviconStatus.register();

export { FaviconStatus };
