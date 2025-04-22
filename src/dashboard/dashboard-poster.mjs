class DashboardPoster {
  constructor(dashboardURL, appId, appTitle, interval) {
    this.dashboardURL = dashboardURL;
    this.appId = appId;
    this.appTitle = appTitle;
    this.startTime = Date.now();
    this.postCount = 0;
    this.restartPostInterval(interval);
    this.checkFPS();
    this.postJson(); // check in on init
  }

  restartPostInterval(interval) {
    let checkinInterval = interval;
    if (checkinInterval > 1) {
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.postJson();
      }, checkinInterval);
    }
  }

  setImageCustom(canvas) {
    this.imageCustom = canvas;
  }

  getImageCustomData() {
    if (this.imageCustom) {
      let data = this.imageCustom.toDataURL("image/png");
      data = data.replace(/^data:image\/(png|jpg);base64,/, ""); // remove the data url prefix (data:image/png;base64,)
      return data;
    }
    return null;
  }

  postJson() {
    let resolutionData = window ? `${window.innerWidth}x${window.innerHeight}` : null; // TODO: only for web
    let checkinData = {
      appId: this.appId,
      appTitle: this.appTitle,
      uptime: Math.round((Date.now() - this.startTime) / 1000), // uptime in seconds
      resolution: resolutionData,
      frameCount: this.frameCount,
      frameRate: this.fps,
      // imageScreenshot: null, // TODO: node app should submit a screenshot
      // imageExtra: imageExtraData,
    };

    // only post an image every 3 posts. don't post null
    if (this.postCount % 3 == 0) {
      checkinData.imageExtra = this.getImageCustomData();
    }

    // post checkin data
    fetch(this.dashboardURL, {
      method: "POST",
      referrerPolicy: "unsafe-url",
      crossorigin: true,
      // mode: "no-cors", // TODO: remove if running in browser? investigate differenced
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkinData),
    })
      .then((response) => {
        return response.json();
      })
      .then((jsonData) => {
        console.log("Checkin success:", jsonData);
        if (this.callback) this.callback(jsonData);
      })
      .catch((error) => {
        console.warn("Checkin failed:", JSON.stringify(error));
      });
    this.postCount++;
  }

  successCallback(callback) {
    this.callback = callback;
  }

  checkFPS() {
    if (!this.fpsLastTime) {
      this.fps = 1;
      this.fpsLastTime = performance.now(); // lazy init
      this.frameCount = 0;
    }
    requestAnimationFrame(() => {
      // store props for posting
      this.fps = Math.round(1000 / (performance.now() - this.fpsLastTime));
      this.frameCount++;
      // keep track of frames
      this.fpsLastTime = performance.now();
      this.checkFPS();
    });
  }
}

export default DashboardPoster;
