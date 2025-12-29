// import DashboardPoster from "./dashboard-poster.mjs";
import DashboardPoster from "../../../../../../src/dashboard/dashboard-poster.mjs";

const APP_ID_KEY = "appId";
const APP_TITLE_KEY = "appTitle";
const API_URL_KEY = "apiUrl";
const POST_INTERVAL_KEY = "postInterval";
const WEBCAM_INTERVAL_KEY = "webcamInterval";

const DEFAULT_APP_ID = "test-app";
const DEFAULT_APP_TITLE = "Test App";
const DEFAULT_DASHBOARD_API = "http://localhost:3002/api/dashboard/";
const DEFAULT_POST_INTERVAL = 10; // 10 minutes
const DEFAULT_WEBCAM_INTERVAL = 5; // 5 minutes

class DashboardPosterView extends HTMLElement {
  async connectedCallback() {
    setTimeout(() => this.setup(), 100); // Delay to ensure env file has been read
  }

  setup() {
    this.loadSettings();
    this.loadEnvFile();
    this.render();
    this.attachEventListeners();
    this.initializePoster();
    this.startWebcamCapture();
  }

  minutesToMs(mins) {
    return mins * 60 * 1000; // Convert minutes to milliseconds
  }

  loadSettings() {
    this.appId = window.electronStore.get(APP_ID_KEY) || DEFAULT_APP_ID;
    this.appTitle = window.electronStore.get(APP_TITLE_KEY) || DEFAULT_APP_TITLE;
    this.apiUrl = window.electronStore.get(API_URL_KEY) || DEFAULT_DASHBOARD_API;
    this.postInterval = window.electronStore.get(POST_INTERVAL_KEY) || DEFAULT_POST_INTERVAL;
    this.webcamInterval = window.electronStore.get(WEBCAM_INTERVAL_KEY) || DEFAULT_WEBCAM_INTERVAL;
  }

  loadEnvFile() {
    let envProps = _store.get("envProps") || {};
    if (envProps) {
      if (envProps["app_id"]) this.appId = envProps["app_id"];
      if (envProps["app_title"]) this.appTitle = envProps["app_title"];
      if (envProps["api_url"]) this.apiUrl = envProps["api_url"];
      if (envProps["post_interval"]) this.postInterval = parseInt(envProps["post_interval"]);
      if (envProps["webcam_interval"]) this.webcamInterval = parseInt(envProps["webcam_interval"]);
      this.saveSettings();
      // console.log("DashboardPoster settings overridden by .env");
    }
  }

  saveSettings() {
    window.electronStore.set(APP_ID_KEY, this.appId);
    window.electronStore.set(APP_TITLE_KEY, this.appTitle);
    window.electronStore.set(API_URL_KEY, this.apiUrl);
    window.electronStore.set(POST_INTERVAL_KEY, this.postInterval);
    window.electronStore.set(WEBCAM_INTERVAL_KEY, this.webcamInterval);
  }

  initializePoster() {
    if (this.poster) this.poster.dispose();
    this.poster = new DashboardPoster(this.apiUrl, this.appId, this.appTitle, this.minutesToMs(this.postInterval));
  }

  startWebcamCapture() {
    // Start the webcam screenshot interval
    this.webcamCaptureInterval = setInterval(() => {
      this.captureWebcam();
      this.captureScreenshot();
    }, this.minutesToMs(this.webcamInterval));

    // Do initial webcam capture after 5 seconds
    setTimeout(() => {
      this.captureWebcam();
      this.captureScreenshot();
      this.poster.postJson(true); // Force post initial images
    }, 8000);
  }

  render() {
    let infoHTML = /* html */ `
      <div>
        <details openXX="">
          <summary>
            <b>Config</b>
          </summary>
          <article>
            <form id="posterSettingsForm">
              <div class="grid">
                <div>
                  <label for="${APP_ID_KEY}">App ID:</label>
                  <input type="text" id="${APP_ID_KEY}" name="appId" value="${this.appId}" required>
                </div>
                <div>
                  <label for="${APP_TITLE_KEY}">App Title:</label>
                  <input type="text" id="${APP_TITLE_KEY}" name="appTitle" value="${this.appTitle}" required>
                </div>
              </div>
              <div class="grid">
                <div>
                  <label for="${POST_INTERVAL_KEY}">Post Interval (minutes):</label>
                  <input type="number" id="${POST_INTERVAL_KEY}" name="postInterval" value="${this.postInterval}" required>
                </div>
                <div>
                  <label for="${WEBCAM_INTERVAL_KEY}">Webcam Interval (minutes):</label>
                  <input type="number" id="${WEBCAM_INTERVAL_KEY}" name="webcamInterval" value="${this.webcamInterval}" required>
                </div>
              </div>
              <div>
                <label for="${API_URL_KEY}">API URL:</label>
                <input type="text" id="${API_URL_KEY}" name="apiURL" value="${this.apiUrl}" required>
              </div>
              <button type="submit">Save and Apply Settings</button>
              <small>Note: Settings will be overridden on next launch by any .env vars</small>
            </form>
          </article>
        </details>
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

        // Store values from the form inputs
        this.appId = this.querySelector(`#${APP_ID_KEY}`).value;
        this.appTitle = this.querySelector(`#${APP_TITLE_KEY}`).value;
        this.apiUrl = this.querySelector(`#${API_URL_KEY}`).value;
        this.postInterval = this.querySelector(`#${POST_INTERVAL_KEY}`).value;
        this.webcamInterval = this.querySelector(`#${WEBCAM_INTERVAL_KEY}`).value;

        this.saveSettings();
        this.initializePoster(); // Re-initialize with new settings

        alert("Settings saved and applied!");
      });
    }
  }

  // Video capture utility methods ------------------------

  createOrUpdateCanvas(video, existingCanvas) {
    // create reusable canvas, but resize it if needed
    let canvsSizeChanged = false;
    if (existingCanvas) {
      if (existingCanvas.width !== video.videoWidth) canvsSizeChanged = true;
      if (existingCanvas.height !== video.videoHeight) canvsSizeChanged = true;
    }

    let canvas = existingCanvas;
    if (!canvas || canvsSizeChanged) {
      canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // capture the video frame
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // this.appendChild(canvas); // append canvas to the DOM for debugging

    return canvas;
  }

  captureWebcam() {
    let webcamVideo = document.querySelector("webcam-feed video");
    if (webcamVideo) {
      this.canvas = this.createOrUpdateCanvas(webcamVideo, this.canvas);
      this.poster.setImageCustom(this.canvas);
      // console.log("Captured webcam frame and set on poster.");
    }
  }

  captureScreenshot() {
    let screenVideo = document.querySelector("screen-capture video");
    if (screenVideo) {
      this.canvScreenshot = this.createOrUpdateCanvas(screenVideo, this.canvScreenshot);
      this.poster.setImageScreenshot(this.canvScreenshot);
      // console.log("Captured screen frame and set on poster.");
    }
  }

  // disposal methods ------------------------

  disconnectedCallback() {
    if (this.poster) this.poster.dispose();
    if (this.webcamCaptureInterval) {
      clearInterval(this.webcamCaptureInterval);
      this.webcamCaptureInterval = null;
    }
    console.log("DashboardPosterView component removed from DOM.");
  }
}

if (!customElements.get("dashboard-poster")) {
  customElements.define("dashboard-poster", DashboardPosterView);
}

export default DashboardPosterView;
