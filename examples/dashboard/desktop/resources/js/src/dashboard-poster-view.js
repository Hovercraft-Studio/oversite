import DashboardPoster from "/js/src/dashboard-poster.mjs";

const APP_ID_STORAGE_KEY = "dashboardPosterAppId";
const APP_TITLE_STORAGE_KEY = "dashboardPosterAppTitle";
const API_URL_STORAGE_KEY = "dashboardPosterApiUrl";
const DEFAULT_APP_ID = "test-app";
const DEFAULT_APP_TITLE = "Test App";
const DEFAULT_DASHBOARD_API = "http://localhost:3002/api/dashboard/";

class DashboardPosterView extends HTMLElement {
  config() {
    // set defaults
    this.appId = DEFAULT_APP_ID;
    this.appTitle = DEFAULT_APP_TITLE;
    this.apiUrl = DEFAULT_DASHBOARD_API;
    // load from env
    console.log("window.envProps", window.envProps);
    if (window.envProps) {
      if (window.envProps["app-id"]) this.appId = window.envProps["app-id"];
      if (window.envProps["app-title"]) this.appTitle = window.envProps["app-title"];
      if (window.envProps["api-url"]) this.apiUrl = window.envProps["api-url"];
      this.saveSettings();
    }
    this.poster = null;
    // API URL and interval are kept constant as per current scope
    this.postInterval = 1 * 60 * 1000; // 10 minutes
    this.webcamInterval = 1 * 60 * 1000; // 5 minutes
  }

  async connectedCallback() {
    setTimeout(async () => this.setup(), 1000); // Delay to ensure env file has been read
  }

  async setup() {
    this.config();
    await this.loadSettings();
    await this.render();
    this.attachEventListeners();
    this.initializePoster();
    this.startWebcamCapture();
  }

  async loadSettings() {
    try {
      const storedAppId = await Neutralino.storage.getData(APP_ID_STORAGE_KEY);
      const storedAppTitle = await Neutralino.storage.getData(APP_TITLE_STORAGE_KEY);
      if (storedAppId) this.appId = storedAppId;
      if (storedAppTitle) this.appTitle = storedAppTitle;
    } catch (error) {
      console.error("Error loading settings from Neutralino.storage:", error);
    }
  }

  async saveSettings() {
    try {
      await Neutralino.storage.setData(APP_ID_STORAGE_KEY, this.appId);
      await Neutralino.storage.setData(APP_TITLE_STORAGE_KEY, this.appTitle);
      console.log("DashboardPoster settings saved.");
    } catch (error) {
      console.error("Error saving settings to Neutralino.storage:", error);
    }
  }

  initializePoster() {
    if (this.poster) {
      // If you have a stop or cleanup method in DashboardPoster, call it here
      // e.g., this.poster.stop();
    }
    this.poster = new DashboardPoster(this.apiUrl, this.appId, this.appTitle, this.postInterval);
    console.log(
      `DashboardPoster initialized at ${this.apiUrl} with App ID: ${this.appId}, App Title: ${this.appTitle}`
    );
  }

  startWebcamCapture() {
    this.webcamCaptureInterval = setInterval(() => {
      this.captureWebcam();
    }, this.webcamInterval); // Start the webcam screenshot interval
    setTimeout(() => {
      this.captureWebcam();
      this.poster.postJson();
    }, 5000); // Do initial capture after 5 seconds
  }

  async render() {
    // Ensure Neutralino global variables are available if used directly in template strings
    // For example, if NL_APPID was used, it should be defined.
    // Here, we are using component's properties this.appId and this.appTitle

    let infoHTML = `
      <div>
        <article>
          <h3>Dashboard Config</h3>
          <form id="posterSettingsForm">
            <p>If <code>app-id</code> or <code>app-title</code> is is set in .env, that will always override these user settings when app is restarted.</p>
            <div>
              <label for="appIdInput">App ID:</label>
              <input type="text" id="appIdInput" name="appId" value="${this.appId}" required>
            </div>
            <div>
              <label for="appTitleInput">App Title:</label>
              <input type="text" id="appTitleInput" name="appTitle" value="${this.appTitle}" required>
            </div>
            <div>
              <label for="apiURLInput">API URL:</label>
              <input type="text" id="apiURLInput" name="apiURL" value="${this.apiUrl}" required>
            </div>
            <button type="submit">Save and Apply Settings</button>
          </form>
        </article>
      </div>
      <hr/>
    `;

    this.innerHTML = infoHTML;
  }

  attachEventListeners() {
    const form = this.querySelector("#posterSettingsForm");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const appIdInput = this.querySelector("#appIdInput");
        const appTitleInput = this.querySelector("#appTitleInput");

        if (appIdInput && appTitleInput) {
          this.appId = appIdInput.value;
          this.appTitle = appTitleInput.value;

          await this.saveSettings();
          this.initializePoster(); // Re-initialize with new settings
          // Optionally, provide user feedback
          alert("Settings saved and applied!");
        }
      });
    }
  }

  captureWebcam() {
    let webcamVideo = document.querySelector("webcam-feed video");
    if (!webcamVideo) {
      console.error("Webcam video element not found.");
      return;
    }
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = webcamVideo.videoWidth;
      this.canvas.height = webcamVideo.videoHeight;
    }
    // capture the webcam video frame
    const context = this.canvas.getContext("2d");
    context.drawImage(webcamVideo, 0, 0, this.canvas.width, this.canvas.height);
    // set on poster
    this.poster.setImageCustom(this.canvas);
  }

  disconnectedCallback() {
    // Clean up if necessary
    // if (this.poster && typeof this.poster.stop === 'function') {
    //   this.poster.stop();
    // }
    console.log("DashboardPosterView component removed from DOM.");
  }
}

if (!customElements.get("dashboard-poster")) {
  customElements.define("dashboard-poster", DashboardPosterView);
}

export default DashboardPosterView;
