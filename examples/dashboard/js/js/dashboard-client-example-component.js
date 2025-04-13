import DashboardCheckinPoller from "./dashboard-poster.mjs";

class DashboardClientExampleComponent extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.postURL = this.getAttribute("post-url") || "http://localhost:3003/dashboard/";
    this.appId = this.getAttribute("app-id") || "no-app-id";
    this.appTitle = this.getAttribute("app-title") || "[NO TITLE]";
    this.postInterval = this.getAttribute("post-interval") || 10; // default to 10 seconds
    this.initCanvas();
    this.render();
    this.initDashboard();
    this.dashboardCheckin.setImageCustom(this.canvasEl);
  }

  initDashboard() {
    this.dashboardCheckin = new DashboardCheckinPoller(
      this.postURL,
      this.appId,
      this.appTitle,
      this.postInterval * 1000
    );
    this.dashboardCheckin.successCallback(this.successCallback.bind(this));
  }

  successCallback(data) {
    this.debugEl.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    this.debugEl.animate([{ outline: "10px solid rgba(0, 255, 0, 1)" }, { outline: "10px solid rgba(0, 255, 0, 0)" }], {
      duration: 1000,
      iterations: 1,
      easing: "ease-in-out",
    });
  }

  initCanvas() {
    this.canvasEl = document.createElement("canvas");
    this.canvasEl.width = 400;
    this.canvasEl.height = 400;

    this.animateCanvas();
  }

  animateCanvas() {
    const ctx = this.canvasEl.getContext("2d");

    // background color
    ctx.fillStyle = this.appId.includes("1") ? "blue" : "gray";
    ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);

    // draw a circle
    // move
    if (!this.pos) {
      this.pos = { x: this.canvasEl.width * Math.random(), y: this.canvasEl.height * Math.random() };
      this.vel = { x: Math.random() > 0.5 ? -1 : 1, y: Math.random() > 0.5 ? -1 : 1 };
    }
    this.pos.x += this.vel.x * 2;
    this.pos.y += this.vel.y * 2;
    if (this.pos.x < 0 || this.pos.x > this.canvasEl.width) this.vel.x *= -1;
    if (this.pos.y < 0 || this.pos.y > this.canvasEl.height) this.vel.y *= -1;
    // draw
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // debug text
    let textY = 10;
    let spacing = 30;
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Dashboard Client Example", 10, (textY += spacing));
    ctx.fillText("Checkin Interval: " + this.postInterval + " seconds", 10, (textY += spacing));
    ctx.fillText("App ID: " + this.appId, 10, (textY += spacing));
    ctx.fillText("App Title: " + this.appTitle, 10, (textY += spacing));
    requestAnimationFrame(() => this.animateCanvas());
  }

  css() {
    return /* css */ `
      :host {
        display: block;
        padding: 1rem;
        background-color: #f0f0f0;
        border-radius: 5px;
        margin: 1rem;
      }
      h3 {
        margin-top: 0;
      }
      #debug {
        display: block;
        white-space: pre-wrap;
        padding: 1rem;
        border-radius: 5px;
        box-sizing: border-box;
      }
      label {
        font-weight: bold;
      }
      canvas {
        max-width: 100%;
      }
    `;
  }

  render() {
    this.innerHTML = /* html */ `
      <style>${this.css()}</style>
      <h3>Dashboard Client Example</h3>
      <label>Config:</label>
      <article>
        <small>
          Checkin URL: <code>${this.postURL}</code>
          Checkin Interval: <code>${this.postInterval}</code> seconds<br>
          App ID: <code>${this.appId}</code><br>
          App Title: <code>${this.appTitle}</code><br>
        </small>
        <div id="canvas-container"></div>
      </article>
      <label>Checkin JSON Response:</label>
      <code id="debug"></code>
    `;
    this.debugEl = this.querySelector("#debug");
    this.canvasContainerEl = this.querySelector("#canvas-container");
    this.canvasContainerEl.appendChild(this.canvasEl);
  }

  static register() {
    customElements.define("dashboard-client-example", DashboardClientExampleComponent);
  }
}

DashboardClientExampleComponent.register();

export { DashboardClientExampleComponent };
