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
    this.render();
    this.initDashboard();
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
    `;
  }

  render() {
    this.innerHTML = /* html */ `
      <style>${this.css()}</style>
      <h3>Dashboard Client Example</h3>
      <label>Config:</label>
      <article>
        <small>
          App ID: <code>${this.appId}</code><br>
          App Title: <code>${this.appTitle}</code><br>
          Checkin Interval: <code>${this.postInterval}</code> seconds<br>
          Checkin URL: <code>${this.postURL}</code>
        </small>
      </article>
      <label>Checkin JSON Response:</label>
      <code id="debug"></code>
    `;
    this.debugEl = this.querySelector("#debug");
  }

  static register() {
    customElements.define("dashboard-client-example", DashboardClientExampleComponent);
  }
}

DashboardClientExampleComponent.register();

export { DashboardClientExampleComponent };
