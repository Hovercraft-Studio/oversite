import fs from "fs";
import cors from "cors";

class DashboardApi {
  static maxHistory = 30;

  constructor(config) {
    // store options
    this.express = config.express;
    this.app = config.app;
    this.pathDashboardData = config.dashboardDataPath; // disk location of dashboard db/images
    this.routeBase = config.dashboardApiRoute; // route for posting data from apps & getting data for dashboard web component

    // create paths & routes
    this.pathImages = this.pathDashboardData + "/images";
    this.pathDbFile = `${this.pathDashboardData}/projects.json`;

    this.routeDbFile = `${this.routeBase}/json`;
    this.routeDbProjectDetails = `${this.routeBase}/json/:appId`;
    this.routeDeleteProject = `${this.routeBase}/delete/:appId`;
    this.routeImages = `${this.routeBase}/images`;

    // init
    this.isWriting = false;
    this.createDir(this.pathImages); // create entire local data path (on disk) recursively by creating the deepest level for images
    this.loadDB();
    this.addRoutes();
  }

  createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  printConfig() {
    console.log("===========================================================================");
    console.log("Dashboard init ============================================================");
    console.log("Paths on disk:");
    console.table([
      ["Dashboard data dir", this.pathDashboardData],
      ["Static www dir", this.pathDashboardData],
      ["Persistent JSON file", this.pathDbFile],
      ["Static www/images dir", this.pathImages],
    ]);
    console.log("WWW routes:");
    console.table([
      ["[POST] Project check-in", this.routeBase],
      ["[GET] All projects JSON", this.routeDbFile],
      ["[GET] Project details JSON", this.routeDbProjectDetails],
      ["[GET] Delete project route", this.routeDeleteProject],
      ["Checkin images route", this.routeImages],
    ]);
    console.log("===========================================================================");
  }

  /////////////////////////////////////////////////////////
  // Server config
  /////////////////////////////////////////////////////////

  addRoutes() {
    // accept JSON post w/open CORS policy
    // this must be in place before following use() calls
    this.app.use(
      cors({
        origin: "*", // Allow all origins
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allow specific methods
        allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
      })
    );

    // Allow posting JSON data and increase default size limit. Posting images was crashing on prod
    this.app.use(this.express.json({ limit: "50mb" }));
    this.app.use(this.express.urlencoded({ limit: "50mb" }));

    // serve static files from the dashboard data path
    this.app.use(this.routeImages, this.express.static(this.pathImages));
    // accept JSON post data from apps
    this.app.post(this.routeBase, this.handlePostData.bind(this));
    // serve current JSON data object for the dashboard web component
    this.app.get(this.routeDbFile, this.returnProjectsJson.bind(this));
    this.app.get(this.routeDbProjectDetails, this.returnJsonProjectDetails.bind(this));
    // add delete route to remove a project's checkin data
    this.app.get(this.routeDeleteProject, this.deleteCheckin.bind(this));
  }

  /////////////////////////////////////////////////////////
  // DB file
  /////////////////////////////////////////////////////////

  loadDB() {
    try {
      let dbFile = fs.readFileSync(this.pathDbFile, "utf8");
      this.dashboardData = JSON.parse(dbFile);
      console.log(`✅ Dashboard data loaded with (${Object.keys(this.dashboardData.checkins).length}) projects`);
    } catch (error) {
      console.warn("⚠️ Error reading dashboard data, creating from scratch. Probably first run, or data was corrupt.");
      this.dashboardData = { checkins: {} };
      this.writeDbFile();
    }
  }

  writeDbFile() {
    if (this.isWriting == true) {
      console.log("Dashboard already writing json, skipping write");
    } else {
      this.isWriting = true;
      try {
        fs.writeFileSync(this.pathDbFile, JSON.stringify(this.dashboardData, null, 2));
        console.log("✅ Dashboard data written to disk:", this.pathDbFile);
      } catch (error) {
        console.error("⚠️ Error writing dashboard data:", error);
      }
      this.isWriting = false;
    }
  }

  /////////////////////////////////////////////////////////
  // Handle request
  /////////////////////////////////////////////////////////

  async returnProjectsJson(req, res) {
    try {
      res.json(this.dashboardData);
    } catch (error) {
      console.error("Error reading dashboard data:", error);
      res.status(500).json({ error: "Failed to read dashboard data" });
    }
  }

  async returnJsonProjectDetails(req, res) {
    const appId = req.params.appId;
    if (this.dashboardData.checkins[appId]) {
      try {
        res.json(this.dashboardData.checkins[appId]);
      } catch (error) {
        console.error("Error reading dashboard data:", error);
        res.status(500).json({ error: "No project data" });
      }
    } else {
      res.status(500).json({ error: "No project data" });
    }
  }

  handlePostData(req, res) {
    // process incoming posted data
    let postedData = req.body;
    console.log(postedData);
    if (!postedData || !postedData.appId) {
      console.error("No valid data posted");
      res.status(400).json({ error: "No valid data posted" });
    } else {
      console.log("Posted data:", postedData);
      this.processCheckIn(postedData);
      res.status(200).json({
        status: `Successful check-in for ${postedData.appId}`,
        appData: postedData,
      });
    }
  }

  deleteCheckin(req, res) {
    const appId = req.params.appId;
    if (this.dashboardData.checkins[appId]) {
      let timestamp = Date.now();
      let projectData = this.dashboardData.checkins[appId];

      // delete images from disk
      if (projectData.history) {
        for (let i = 0; i < projectData.history.length; i++) {
          this.deleteImagesFromCheckin(projectData.history[i]);
        }
      }
      this.deleteImagesFromCheckin(projectData);

      // delete checkin data from memory
      delete this.dashboardData.checkins[appId].history;
      delete this.dashboardData.checkins[appId];

      // save to disk
      this.writeDbFile();
      res.status(200).json({ status: `Deleted checkin data for ${appId}` });
      console.log(`Deleted checkin data for ${appId} in ${Date.now() - timestamp}ms`);
    } else {
      res.status(404).json({ error: `No checkin data found for ${appId}` });
    }
  }

  /////////////////////////////////////////////////////////
  // Update db and image files
  /////////////////////////////////////////////////////////

  processCheckIn(postedData) {
    let appId = postedData.appId;

    // get cur time and add lastSeen timestamp
    // `lastSeen` is the last time the data was updated -in seconds-
    let timestamp = Date.now();
    let lastSeen = Math.round(timestamp / 1000);
    postedData.lastSeen = lastSeen;
    if (postedData.appUptime) postedData.lastSeenApp = lastSeen; // special secondary lastSeen if it's a web app and not the java app

    // save images & store/transform incoming data w/history
    this.saveImages(postedData, timestamp, appId, lastSeen);
    this.saveCheckinData(postedData, appId, lastSeen);
    this.updateHistory(postedData, appId);
    console.log(`received post data for ${appId} at ${lastSeen}`);

    // write database file to disk
    this.writeDbFile();
    // console.log(`Dashboard data processed in ${Date.now() - timestamp}ms`);
  }

  saveCheckinData(postedData, appId, lastSeen) {
    // add to data or create if appId doesn't exist yet
    if (!this.dashboardData.checkins[appId]) {
      this.dashboardData.checkins[appId] = postedData;
    } else {
      // update existing data
      this.dashboardData.checkins[appId] = { ...this.dashboardData.checkins[appId], ...postedData };
    }
  }

  updateHistory(postedData, appId) {
    // deepcopy posted data
    let deepCopy = JSON.parse(JSON.stringify(postedData));
    console.log("Updating history for", appId);
    console.log("- Data:", deepCopy);

    // create history array if it doesn't exist and add new data to the front
    // use a deep copy of the checkin data in history to avoid weird json circular reference issues
    if (!this.dashboardData.checkins[appId].history) {
      this.dashboardData.checkins[appId].history = [];
    }
    this.dashboardData.checkins[appId].history.unshift(deepCopy);

    // remove the oldest past x entries
    while (this.dashboardData.checkins[appId].history.length > DashboardApi.maxHistory) {
      // Remove the oldest entry from the end
      let checkin = this.dashboardData.checkins[appId].history.pop();
      // and delete images from remove checkin
      try {
        if (checkin.imageScreenshotSrc) fs.unlinkSync(checkin.imageScreenshotSrc);
        if (checkin.imageExtraSrc) fs.unlinkSync(checkin.imageExtraSrc);
      } catch (error) {
        console.error("Error deleting image files:", error);
      }
    }
  }

  saveImages(postedData, timestamp, appId, lastSeen) {
    // save images to disk and replace base64 data with www path on postedData object
    if (postedData.imageScreenshot) {
      const imgPathOnDisk = `${this.pathImages}/${appId}-${timestamp}-screenshot.png`;
      this.base64ToFile(postedData.imageScreenshot, imgPathOnDisk);
      postedData.imageScreenshotSrc = imgPathOnDisk;
      postedData.imageScreenshot = `${this.routeImages}/${appId}-${timestamp}-screenshot.png`;
      postedData.lastSeenScreenshot = lastSeen;
    }
    if (postedData.imageExtra) {
      const imgPathOnDisk = `${this.pathImages}/${appId}-${timestamp}-extra.png`;
      this.base64ToFile(postedData.imageExtra, imgPathOnDisk);
      postedData.imageExtraSrc = imgPathOnDisk;
      postedData.imageExtra = `${this.routeImages}/${appId}-${timestamp}-extra.png`;
      postedData.lastSeenExtra = lastSeen;
    }
  }

  base64ToFile(base64String, outputFile) {
    try {
      const buffer = Buffer.from(base64String, "base64");
      fs.writeFileSync(outputFile, buffer);
    } catch (error) {
      console.error(`Error writing base64 to file ${outputFile}:`, error);
    }
  }

  deleteImagesFromCheckin(checkIn) {
    this.deleteImage(checkIn.imageScreenshotSrc);
    this.deleteImage(checkIn.imageExtraSrc);
  }

  deleteImage(imagePath) {
    if (!imagePath) return;
    try {
      fs.unlinkSync(imagePath);
      console.log("Deleted image:", imagePath);
    } catch (error) {
      console.error("Error deleting image file:", imagePath);
    }
  }
}

export default DashboardApi;
