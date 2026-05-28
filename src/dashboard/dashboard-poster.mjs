class DashboardPoster {
  constructor(
    dashboardURL,
    appId,
    appTitle,
    interval = 10 * 60 * 1000,
    screenshotInterval = 15 * 60 * 1000,
    screenIndex = null,
  ) {
    this.dashboardURL = dashboardURL;
    this.appId = appId;
    this.appTitle = appTitle;
    this.interval = interval;
    this.screenshotInterval = screenshotInterval;
    this.screenIndex = screenIndex;
    this.startTime = Date.now();
    this.postCount = 0;
    this.customProps = {};
    this.isBrowser = typeof window !== "undefined";
    if (this.isBrowser) this.checkFPS();
    if (!this.isBrowser) this.prepBackend(); // takes first screenshot, then posts
    this.restartPostInterval();
    if (this.isBrowser) this.postJson(); // browser checks in immediately; Node waits for screenshot
    console.log("DashboardPoster initialized with URL:", this.dashboardURL);
  }

  restartPostInterval() {
    if (this.interval > 1) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = setInterval(() => {
        this.postJson();
      }, this.interval);
    }
  }

  dispose() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
  }

  setImageCustom(canvas) {
    this.imageCustomCanvas = canvas;
  }

  setImageScreenshot(canvas) {
    this.imageScreenshotCanvas = canvas;
  }

  getImageCustomData() {
    if (this.imageCustomCanvas) {
      let data = this.imageCustomCanvas.toDataURL("image/png");
      data = data.replace(/^data:image\/(png|jpg);base64,/, ""); // remove the data url prefix (data:image/png;base64,)
      return data;
    }
    return null;
  }

  getImageScreenshotData() {
    if (this.imageScreenshotCanvas) {
      let data = this.imageScreenshotCanvas.toDataURL("image/png");
      data = data.replace(/^data:image\/(png|jpg);base64,/, ""); // remove the data url prefix (data:image/png;base64,)
      return data;
    }
    return null;
  }

  setCustomProp(key, value) {
    if (typeof key === "string" && key.length > 0) {
      this.customProps[key] = value;
    } else {
      console.warn("Invalid key for custom property. Key must be a non-empty string.");
    }
  }

  postJson(forceImages = false) {
    let resolutionData = this.isBrowser ? `${window.innerWidth}x${window.innerHeight}` : "headless";
    let checkinData = {
      appId: this.appId,
      appTitle: this.appTitle,
      uptime: Math.round((Date.now() - this.startTime) / 1000), // uptime in seconds
      resolution: resolutionData,
      frameCount: this.frameCount,
      frameRate: this.fps,
      // imageScreenshot: null, // will be set later if available
      // imageExtra: imageExtraData,
    };

    // Add custom properties if available
    if (Object.keys(this.customProps).length > 0) {
      Object.assign(checkinData, this.customProps);
      this.customProps = {}; // reset custom props after posting
    }

    // Add image data if available
    // only post an image every 3 posts
    if (this.postCount % 3 == 0 || forceImages) {
      checkinData.imageExtra = this.getImageCustomData();
    }
    // offset screenshot from webcam to alternate for smaller payloads
    if (this.postCount % 3 == 1 || forceImages) {
      if (this.imageScreenshotCanvas) {
        checkinData.imageScreenshot = this.getImageScreenshotData();
        this.imageScreenshotCanvas = null; // reset the screenshot canvas after posting
      }
    }
    if (this.imageScreenshotFile) {
      // if a screenshot has been taken, send it!
      checkinData.imageScreenshot = this.imageScreenshotFile;
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
      })
      .finally(() => {
        // Clear screenshot after post attempt so we don't send the same one twice
        if (checkinData.imageScreenshot) this.imageScreenshotFile = null;
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
      if (this.fetchInterval) this.checkFPS(); // only if we have an interval running, otherwise, we're disposed
    });
  }

  /////////////////////////////////////
  // Backend additions for nodejs apps
  /////////////////////////////////////

  async prepBackend() {
    // this doesn't exactly work on Mac! https://github.com/bencevans/screenshot-desktop/issues/156
    // import node modules
    this.fs = await import("fs");
    this.path = await import("path");
    this.os = await import("os");
    const screenshotModule = await import("screenshot-desktop");
    this.screenshot = screenshotModule.default; // Use the default export
    // this.screenshot.listDisplays().then((displays) => {
    //   console.log(displays);
    // });

    await this.buildTempDir();
    await this.takeScreenshotAsync(); // first screenshot before first post
    console.log(
      `First screenshot ready: ${this.imageScreenshotFile ? this.imageScreenshotFile.length + " bytes base64" : "NONE"}`,
    );
    this.postJson(); // first check-in with screenshot ready
    setInterval(() => {
      this.takeScreenshot();
    }, this.screenshotInterval);
  }

  async buildTempDir() {
    try {
      // Use fs.promises for cleaner async code
      const prefix = this.path.join(this.os.tmpdir(), "nodejs-dashboard-screenshots");
      this.tmpDir = await this.fs.promises.mkdtemp(prefix);
      this.screenshotFilePath = this.path.join(this.tmpDir, "screenshot.jpg");
      return this.tmpDir;
    } catch (error) {
      console.error("Error creating temp directory:", error);
      throw error; // Rethrow to be caught in prepBackend
    }
  }

  // Fire-and-forget version for interval use
  takeScreenshot() {
    this.takeScreenshotAsync().catch((err) => {
      console.error("Screenshot failed:", err);
    });
  }

  // Awaitable version — resolves once imageScreenshotFile is set
  async takeScreenshotAsync() {
    const getScreenId = async () => {
      if (this.screenIndex != null) {
        const displays = await this.screenshot.listDisplays();
        console.log("Available displays:", JSON.stringify(displays));
        const idx = Math.min(this.screenIndex, displays.length - 1);
        console.log(`Using screen index ${this.screenIndex} → display id: ${displays[idx].id}`);
        return displays[idx].id;
      }
      return null;
    };

    try {
      const screenId = await getScreenId();
      const opts = { format: "png", filename: this.screenshotFilePath };
      if (screenId != null) opts.screen = screenId;
      await this.screenshot(opts);
      const data = await this.fs.promises.readFile(this.screenshotFilePath);
      this.imageScreenshotFile = Buffer.from(data).toString("base64");
    } catch (err) {
      console.error("Failed to take screenshot:", err);
    }
  }

  deleteScreenshot() {
    this.fs.unlink(this.screenshotFilePath, (err) => {
      if (err) return console.error(err);
    });
  }
}

export default DashboardPoster;
