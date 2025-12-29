import DOMUtil from "../util/dom-util.mjs";

class FaviconStatus extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    this.link = document.querySelector('link[rel*="shortcut icon"]');

    // If no favicon link exists, create one
    if (!this.link) {
      this.link = document.createElement("link");
      this.link.rel = "shortcut icon";
      this.link.type = "image/x-icon";
      this.link.href = "/icon.png"; // default favicon
      document.head.appendChild(this.link);
    }

    this.canvas = document.createElement("canvas");
    this.canvas.width = 16;
    this.canvas.height = 16;
    this.context = this.canvas.getContext("2d");
    this.observer = DOMUtil.observeCssClassChanges(
      this.updateFavicon.bind(this)
    );
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  updateFavicon(classList) {
    if (!this.link) {
      console.warn("FaviconStatus: No favicon link element found");
      return;
    }

    if (classList.contains("no-socket")) {
      this.drawFavicon("#ff3333");
    } else if (classList.contains("has-socket")) {
      this.drawFavicon("#33ff33");
    } else {
      this.link.href = "/icon.png"; // reset to default favicon
    }
  }

  drawFavicon(color) {
    if (!this.link) {
      console.warn("FaviconStatus: No favicon link element found");
      return;
    }

    this.context.clearRect(0, 0, 16, 16);
    this.context.beginPath();
    this.context.fillStyle = color;
    this.context.arc(8, 8, 5, 0, 2 * Math.PI);
    this.context.fill();

    try {
      this.link.href = this.canvas.toDataURL("image/png"); // update favicon
    } catch (error) {
      console.error("FaviconStatus: Failed to update favicon:", error);
    }
  }

  static register() {
    customElements.define("favicon-status", FaviconStatus);
  }
}

FaviconStatus.register();

export { FaviconStatus };
