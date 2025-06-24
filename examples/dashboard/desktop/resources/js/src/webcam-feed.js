class WebcamFeed extends HTMLElement {
  constructor() {
    super();
    // You can choose to use Shadow DOM for encapsulation if desired
    // this.attachShadow({ mode: 'open' });
    // For simplicity, this example will render directly into the component's light DOM
  }

  async initWebcam() {
    const videoElement = this.querySelector("#webcam-video");
    try {
      // Check if the browser supports getUserMedia
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
      } else {
        console.error("getUserMedia is not supported in this browser.");
      }
    } catch (err) {
      // replace video element with error message
      let errorMessage = document.createElement("p");
      errorMessage.textContent = `Error accessing webcam: ${err.message}`;
      errorMessage.style.color = "red";
      videoElement.replaceWith(errorMessage);
      console.error("Error accessing webcam:", err);
      // Neutralino.os.showMessageBox("Error", `Failed to access webcam: ${err.message}`);
    }
  }

  async connectedCallback() {
    this.render();
    this.initWebcam();
  }

  async render() {
    let html = `
      <style>
        webcam-feed video {
          width: 100%;
          border-radius: 8px;
        }
      </style>
      <div>
        <article>
          <h3>Webcam</h3>
          <video id="webcam-video" autoplay playsinline></video>
        </article>
      </div>
      <hr>
    `;
    this.innerHTML = html;
  }
}

if (!customElements.get("webcam-feed")) {
  customElements.define("webcam-feed", WebcamFeed);
}

export default WebcamFeed;
