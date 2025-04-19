import fs from "fs";
import cors from "cors";
import { logMagenta } from "./util.mjs";

class DashboardApi {
  static maxHistory = 100;

  constructor(app, express, dashboardDataPath, dashboardApiRoute, postRouteAlt = null) {
    // store options
    this.express = express;
    this.app = app;
    this.pathDashboardData = dashboardDataPath; // disk location of dashboard db/images
    this.routeBase = dashboardApiRoute; // route for posting data from apps & getting data for dashboard web component
    this.postRouteAlt = postRouteAlt; // if the checkin POST route needs to be different than the nice base api route, this lets the old clients send checkins to `/`, but new clients to `/api/dashboard`

    // create paths & routes
    this.pathImages = this.pathDashboardData + "/images";
    this.pathDbFile = `${this.pathDashboardData}/projects.json`;

    this.routeDbFile = `${this.routeBase}/json`;
    this.routeDbProjectDetails = `${this.routeBase}/json/:appId`;
    this.routeDeleteProject = `${this.routeBase}/delete/:appId`;
    this.routeImages = `${this.routeBase}/images`;
    this.routeAuth = `${this.routeBase}/auth`;

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
    logMagenta("Dashboard init ============================================================");
    logMagenta("Paths on disk: ------------------------------------------------------------");
    console.table([
      ["Dashboard data dir", this.pathDashboardData],
      ["Static www dir", this.pathDashboardData],
      ["Persistent JSON file", this.pathDbFile],
      ["Static www/images dir", this.pathImages],
    ]);
    logMagenta("Dashboard WWW routes: -----------------------------------------------------");
    console.table([
      ["[POST] Project check-in", this.routeBase],
      ["[POST] Project check-in (alt)", this.postRouteAlt],
      ["[GET] All projects JSON", this.routeDbFile],
      ["[GET] Project details JSON", this.routeDbProjectDetails],
      ["[GET] Delete project route", this.routeDeleteProject],
      ["Checkin images route", this.routeImages],
    ]);
    logMagenta("===========================================================================");
  }

  /////////////////////////////////////////////////////////
  // Server config
  /////////////////////////////////////////////////////////

  addRoutes() {
    // MIDDLEWARE CONFIG ----------------------------------
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

    // SPECIFIC ROUTE HANDLING ----------------------------
    // log in from frontend
    this.app.post(this.routeAuth, this.handleAuthAttempt.bind(this));
    // accept JSON post data from apps
    this.app.post(this.routeBase, this.handlePostData.bind(this));
    if (this.postRouteAlt) this.app.post(this.postRouteAlt, this.handlePostData.bind(this));
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
      logMagenta(`✅ Dashboard data loaded with (${Object.keys(this.dashboardData.checkins).length}) projects`);
    } catch (error) {
      logMagenta("⚠️ Error reading dashboard data, creating from scratch. Probably first run, or data was corrupt.");
      this.dashboardData = { checkins: {} };
      this.writeDbFile();
    }
  }

  writeDbFile() {
    if (this.isWriting == true) {
      logMagenta("Dashboard already writing json, skipping write");
    } else {
      this.isWriting = true;
      try {
        fs.writeFileSync(this.pathDbFile, JSON.stringify(this.dashboardData, null, 2));
        logMagenta("✅ Dashboard data written to disk:", this.pathDbFile);
      } catch (error) {
        logMagenta("⚠️ Error writing dashboard data:", error);
      }
      this.isWriting = false;
    }
  }

  /////////////////////////////////////////////////////////
  // Auth
  /////////////////////////////////////////////////////////

  handleAuthAttempt(req, res) {
    const { username, password } = req.body;
    const isValid = this.validateCredentials(username, password);
    if (isValid) {
      res.status(200).json({ message: "Authentication successful" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  }

  validateCredentials(username, password) {
    // Replace with your own authentication logic
    const validUsername = "admin";
    const validPassword = "password";
    return username === validUsername && password === validPassword;
  }

  /////////////////////////////////////////////////////////
  // Handle project request
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
    // logMagenta("Posted data:", postedData);
    if (!postedData || !postedData.appId) {
      console.error("No valid data posted");
      res.status(400).json({ error: "No valid data posted" });
    } else {
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
      logMagenta(`Deleted checkin data for ${appId} in ${Date.now() - timestamp}ms`);
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
    logMagenta(`received post data for ${appId} at ${lastSeen}`);

    // write database file to disk
    this.writeDbFile();
    // logMagenta(`Dashboard data processed in ${Date.now() - timestamp}ms`);
  }

  saveCheckinData(postedData, appId, lastSeen) {
    // add to data or create if appId doesn't exist yet
    if (!this.dashboardData.checkins[appId]) {
      this.dashboardData.checkins[appId] = postedData;
    } else {
      // update existing data
      // remove null images so they don't wipe the latest checkin image ref
      if (postedData.imageScreenshot == null) delete postedData.imageScreenshot;
      if (postedData.imageExtra == null) delete postedData.imageExtra;
      this.dashboardData.checkins[appId] = { ...this.dashboardData.checkins[appId], ...postedData };
    }
  }

  updateHistory(postedData, appId) {
    // deepcopy posted data
    let deepCopy = JSON.parse(JSON.stringify(postedData));
    // logMagenta("Updating history for", appId);
    // logMagenta("- Data:", deepCopy);

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
      logMagenta("Deleted image:", imagePath);
    } catch (error) {
      console.error("Error deleting image file:", imagePath);
    }
  }
}

export default DashboardApi;
