class FaviconStatus extends HTMLElement {
  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    this.link = document.querySelector('link[rel*="shortcut icon"]');
    this.canvas = document.createElement("canvas");
    this.canvas.width = 16;
    this.canvas.height = 16;
    this.context = this.canvas.getContext("2d");

    // listen to body for class changes
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          this.updateFavicon(mutation.target.classList);
        }
      });
    });
    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  disconnectedCallback() {
    // clean up observer
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  updateFavicon(classList) {
    console.log("classList", classList);
    if (classList.contains("no-socket")) {
      this.drawCircle("red");
      this.link.href = this.canvas.toDataURL("image/png"); // update favicon
    } else if (classList.contains("has-socket")) {
      this.drawCircle("green");
      this.link.href = this.canvas.toDataURL("image/png"); // update favicon
    } else {
      this.link.href = "/icon.png"; // reset to default favicon
    }
  }

  drawCircle(color) {
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
