import "./app-config.js";
import "./system-info-display.js";
import "./dashboard-poster-view.js";
import "./webcam-feed.js";
import "./screen-capture.js";
import "./app-info.js";
import "./app-help.js";

class MainApplication extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    await this.loadEnvFile();
    this.render();
    this.checkMinimizeOnStart();
    // _store.addListener(this, "envProps");
  }

  async loadEnvFile() {
    this.envProps = {};
    try {
      // Use Electron's IPC to read the .env file
      let data = await window.electronAPI.readFile("./.env");
      if (data) {
        // Parse the .env file content and set global variables
        // console.log("INFO: .env file loaded successfully.");
        data.split("\n").forEach((line) => {
          if (line && !line.startsWith("#")) {
            let [key, value] = line.split("=");
            if (key && value) {
              this.envProps[key.trim()] = value.trim();
            }
          }
        });
      }
    } catch (error) {
      console.error("Error reading .env file:", error);
    }
    // Set the envProps in the global store
    _store.set("envProps", this.envProps);
  }

  checkMinimizeOnStart() {
    if (this.envProps.minimize_on_start === "true") {
      setTimeout(() => {
        window.electronAPI.messageToBackend({ key: "minimize", value: true });
      }, 1000); // Delay to ensure the app is fully loaded
    }
  }

  render() {
    this.innerHTML = /* html */ `
      <header>
        <h1>
          Dashboard Poster
          <button id="reload" style="float:right;" onclick="location.reload();">⟳</button>
        </h1>
      </header>
      <main>
        <hr>
        <app-config></app-config>
        <dashboard-poster></dashboard-poster>
        <webcam-feed></webcam-feed>
        <screen-capture></screen-capture>
        <!--<system-info-display></system-info-display>-->
        <app-help></app-help>
        <app-info></app-info>  
      </main>
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
