class DashboardCheckinPoller {
  constructor(dashboardURL, appId, appTitle, interval) {
    this.dashboardURL = dashboardURL;
    this.appId = appId;
    this.appTitle = appTitle;
    this.startTime = Date.now();
    this.restartInterval(interval);
    this.postJson(); // check in on init
  }

  restartInterval(interval) {
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
      console.log("imageCustom data:", data);
      // remove the data url prefix (data:image/png;base64,)
      data = data.replace(/^data:image\/(png|jpg);base64,/, "");
      return data;
    }
    return null;
  }

  postJson() {
    fetch(this.dashboardURL, {
      method: "POST",
      referrerPolicy: "unsafe-url",
      crossorigin: true,
      // mode: "no-cors", // TODO: remove if running in browser? investigate differenced
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appId: this.appId,
        appTitle: this.appTitle,
        uptime: Math.round((Date.now() - this.startTime) / 1000), // uptime in seconds
        resolution: `${window.innerWidth}x${window.innerHeight}`, // TODO: only for web
        frameCount: 1,
        frameRate: 60,
        imageScreenshot: null,
        imageExtra: this.getImageCustomData(),
      }),
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
  }

  successCallback(callback) {
    this.callback = callback;
  }
}

export default DashboardCheckinPoller;
