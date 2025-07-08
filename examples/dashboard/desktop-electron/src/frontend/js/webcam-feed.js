class WebcamFeed extends HTMLElement {
  constructor() {
    super();
    this.currentStream = null;
  }

  async connectedCallback() {
    this.render();
    await this.populateCameraList();
    this.querySelector("#webcam-select").addEventListener("change", (e) => this.onCameraChange(e.target.value));
  }

  async populateCameraList() {
    const select = this.querySelector("#webcam-select");
    // clear & add “None” option
    select.innerHTML = `<option value="">None</option>`;
    // request permission once to populate device labels
    try {
      const permStream = await navigator.mediaDevices.getUserMedia({ video: true });
      permStream.getTracks().forEach((t) => t.stop());
    } catch (permErr) {
      console.warn("Could not get permission to access camera labels:", permErr);
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      devices
        .filter((d) => d.kind === "videoinput")
        .forEach((device) => {
          const opt = document.createElement("option");
          opt.value = device.deviceId;
          opt.text = device.label || `Camera ${select.length}`;
          select.appendChild(opt);
        });
    } catch (err) {
      console.error("Could not list cameras:", err);
    }
  }

  clearOldStream() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
    this.videoElement.srcObject = null;
    this.videoElement.removeAttribute("src");
  }

  async onCameraChange(deviceId) {
    this.clearOldStream();
    if (deviceId) {
      try {
        console.log("Accessing camera with deviceId:", deviceId);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId },
        });
        this.currentStream = stream;
        this.videoElement.srcObject = stream;
        this.videoElement.src = stream;
        console.log("Camera stream started successfully");
      } catch (err) {
        console.error("Error accessing selected camera:", err);
      }
    }
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
      </style>
      <div>
        <details openXX="">
          <summary><b>Webcam</b></summary>
          <article>
            <h3>Webcam</h3>
            <select id="webcam-select"></select>
            <video id="webcam-video" autoplay playsinline></video>
          </article>
        </details>
      </div>
      <hr>
    `;
    this.videoElement = this.querySelector("#webcam-video");
  }
}

if (!customElements.get("webcam-feed")) {
  customElements.define("webcam-feed", WebcamFeed);
}

export default WebcamFeed;
