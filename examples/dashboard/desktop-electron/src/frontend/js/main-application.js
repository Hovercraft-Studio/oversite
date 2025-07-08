import "./app-config.js";
import "./system-info-display.js";
import "./dashboard-poster-view.js";
import "./webcam-feed.js";
import "./app-info.js";
import "./app-help.js";

class MainApplication extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <header>
        <h1>
          Dashboard Poster
          <button id="reload" style="float:right;" onclick="location.reload();">⟳</button>
        </h1>
      </header>
      <main>
        <app-config></app-config>
        <dashboard-poster></dashboard-poster>
        <webcam-feed></webcam-feed>
        <!--<system-info-display></system-info-display>-->
        <app-help></app-help>
        <app-info></app-info>
      </main>
      <footer>
        <p></p>
      </footer>
    `;
  }

  disconnectedCallback() {
    console.log("MainApplication component removed from DOM.");
  }
}

// Define the custom element for the main application
if (!customElements.get("main-application")) {
  customElements.define("main-application", MainApplication);
}
