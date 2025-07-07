import "./app-config.js";
import "./system-info-display.js";
import "./dashboard-poster-view.js";
import "./webcam-feed.js";

class MainApplication extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    let electronVersions = _store.get("main_config").versions;
    // Define the HTML structure for the main application
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
      </main>
      <footer>
        <p>Electron: ${electronVersions.electron} | Chromium: ${electronVersions.chrome} | Node: ${electronVersions.node}</p>
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
