const WEBCAM_INDEX_KEY = "webcamIndex";
const DEFAULT_WEBCAM_INDEX = 0; // none

class WebcamFeed extends HTMLElement {
  constructor() {
    super();
    this.currentStream = null;
  }

  async connectedCallback() {
    this.loadSettings();
    this.loadEnvFile();
    this.render();
    await this.populateCameraList();
    this.selectElement.addEventListener("change", (e) => this.onCameraChange(e.target.value));
    this.activateWebcam();
  }

  loadSettings() {
    this.webcamIndex = window.electronStore.get(WEBCAM_INDEX_KEY) || DEFAULT_WEBCAM_INDEX;
  }

  loadEnvFile() {
    let envProps = _store.get("envProps") || {};
    if (envProps) {
      if (envProps["webcam_index"]) this.webcamIndex = parseInt(envProps["webcam_index"]);
      this.saveSettings();
      // console.log("Webcam index overridden by .env");
    }
  }

  saveSettings() {
    window.electronStore.set(WEBCAM_INDEX_KEY, this.webcamIndex);
  }

  activateWebcam() {
    setTimeout(() => {
      this.setCameraByIndex(this.webcamIndex);
    }, 1000);
  }

  async populateCameraList() {
    // clear & add “None” option
    this.selectElement.innerHTML = `<option value="">None</option>`;
    // request permission once to populate device labels
    try {
      const permStream = await navigator.mediaDevices.getUserMedia({ video: true });
      permStream.getTracks().forEach((t) => t.stop());
    } catch (permErr) {
      console.warn("Could not get permission to access camera labels:", permErr);
    }
    try {
      this.devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = this.devices.filter((d) => d.kind === "videoinput");
      // build menu options
      this.devices.forEach((device) => {
        const opt = document.createElement("option");
        opt.value = device.deviceId;
        opt.text = device.label || `Camera ${this.selectElement.length}`;
        this.selectElement.appendChild(opt);
      });
    } catch (err) {
      console.error("Could not list cameras:", err);
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

  async onCameraChange(deviceId) {
    this.clearOldStream();
    this.webcamIndex = this.selectElement.selectedIndex;
    this.saveSettings();
    if (deviceId) {
      try {
        // console.log("Accessing camera with deviceId:", deviceId);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: deviceId, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        this.currentStream = stream;
        this.videoElement.srcObject = stream;
        this.videoElement.src = stream;
        this.videoElement.play();
        this.setAttribute("streaming", "true");
      } catch (err) {
        console.error("Error accessing selected camera:", err);
      }
    }
  }

  setCameraByIndex(index) {
    // emit <select> change event to trigger camera change
    this.selectElement.selectedIndex = index;
    this.selectElement.dispatchEvent(new Event("change"));
  }

  render() {
    this.innerHTML = /* html */ `
      <style>
        webcam-feed select,
        webcam-feed video {
          width: 100%;
          margin-bottom: 8px;
          border-radius: 8px;
        }
        video:not([src]) {
          display: none;
        }
        webcam-feed summary b::after {
          content: " 🔴";
          font-weight: normal;
        }
        webcam-feed[streaming] summary b::after {
          content: " 🟢";
        }
      </style>
      <div>
        <details openXX="">
          <summary><b>Webcam</b></summary>
          <article>
            <select id="webcam-select"></select>
            <video id="webcam-video" autoplay playsinline></video>
          </article>
        </details>
      </div>
      <hr>
    `;
    this.videoElement = this.querySelector("#webcam-video");
    this.selectElement = this.querySelector("#webcam-select");
  }
}

if (!customElements.get("webcam-feed")) {
  customElements.define("webcam-feed", WebcamFeed);
}

export default WebcamFeed;
