const SCREEN_CAPTURE_ACTIVE_KEY = "captureActive";
const DEFAULT_SCREEN_CAPTURE_ACTIVE = false;
const DEFAULT_SCREEN_CAPTURE_INTERVAL = 5; // in minutes

class ScreenCapture extends HTMLElement {
  constructor() {
    super();
    this.currentStream = null;
  }

  async connectedCallback() {
    this.loadSettings();
    this.loadEnvFile();
    this.render();
    this.checkboxElement.addEventListener("change", (e) => this.onStreamToggled(e.target.checked));
    this.startScreenCaptureOnInit();
  }

  loadSettings() {
    this.captureActive = window.electronStore.get(SCREEN_CAPTURE_ACTIVE_KEY) || DEFAULT_SCREEN_CAPTURE_ACTIVE;
    this.captureIntervalMinutes = DEFAULT_SCREEN_CAPTURE_INTERVAL;
  }

  loadEnvFile() {
    let envProps = _store.get("envProps") || {};
    if (envProps) {
      if (envProps["capture_active"]) this.captureActive = envProps["capture_active"] == "true";
      this.saveSettings();
      // console.log("captureActive overridden by .env");
    }
  }

  saveSettings() {
    window.electronStore.set(SCREEN_CAPTURE_ACTIVE_KEY, this.captureActive);
  }

  onStreamToggled(active) {
    this.captureActive = active;
    this.saveSettings();
    if (this.captureActive) {
      this.initScreenCapture();
    } else {
      this.clearOldStream();
    }
  }

  startScreenCaptureOnInit() {
    if (this.captureActive) {
      setTimeout(() => {
        this.initScreenCapture();
      }, 1000);
    }
  }

  clearOldStream() {
    this.removeAttribute("streaming");
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
    this.videoElement.srcObject = null;
    this.videoElement.removeAttribute("src");
  }

  async initScreenCapture() {
    this.clearOldStream();
    try {
      // relies on addScreenCapturePermission() in main.js to request permission
      navigator.mediaDevices
        .getDisplayMedia({
          audio: false,
          video: {
            width: 1920,
            height: 1080,
            frameRate: 1 / (this.captureIntervalMinutes * 60), // Convert minutes to seconds for frame rate
            // cursor: "always", // always show cursor
            // displaySurface: "monitor", // capture the entire monitor
          },
        })
        .then((stream) => {
          this.currentStream = stream;
          this.videoElement.srcObject = stream;
          this.videoElement.src = stream;
          // this.videoElement.play();
          this.videoElement.onloadedmetadata = (e) => this.videoElement.play();
          this.setAttribute("streaming", "true");
        })
        .catch((e) => console.log(e));
    } catch (err) {
      console.error("Error accessing screen capture:", err);
    }
  }

  render() {
    this.innerHTML = /* html */ `
      <style>
        screen-capture select,
        screen-capture video {
          width: 100%;
          margin-bottom: 8px;
          border-radius: 8px;
        }
        video:not([src]) {
          display: none;
        }
        screen-capture summary b::after {
          content: " 🔴";
          font-weight: normal;
        }
        screen-capture[streaming] summary b::after {
          content: " 🟢";
        }
      </style>
      <div>
        <details openXX="">
          <summary><b>Screen Capture</b></summary>
          <article>
            <video id="screen-capture-video" autoplay playsinline></video>
            <label>
              <input type="checkbox" id="capture-active-checkbox" role="switch" ${this.captureActive ? "checked" : ""}>
              Enable Screen Capture
            </label>
          </article>
        </details>
      </div>
      <hr>
    `;
    this.videoElement = this.querySelector("#screen-capture-video");
    this.checkboxElement = this.querySelector("#capture-active-checkbox");
  }
}

if (!customElements.get("screen-capture")) {
  customElements.define("screen-capture", ScreenCapture);
}

export default ScreenCapture;
