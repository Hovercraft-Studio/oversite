import { promises as fs } from "fs";
import { join } from "path";
import { logGreen } from "./util.mjs";

class PersistentState {
  constructor(wsServer, app, baseDataPath, projectId) {
    this.wsServer = wsServer;
    this.app = app;
    this.baseDataPath = join(baseDataPath);
    this.projectId = projectId;

    this.dataPath = join(this.baseDataPath, `${this.projectId}.json`);

    this.lastSaveTime = Date.now();
    this.state = {};
    this.loadStateFromFile(this.dataPath);
    this.listenToWsServer();
    this.addRoutes();
  }

  addRoutes() {
    // this.app.get("/", (req, res) => {
    //   res.json({ message: "Welcome to AppStore" });
    // });

    this.app.get("/api/state/get/:key", (req, res) => {
      const key = req.params.key;
      if (this.getState(key)) {
        res.json(this.getState(key));
      } else {
        res.json(null);
      }
    });

    this.app.get("/api/state/all", (req, res) => {
      res.json(this.state);
    });

    this.app.get("/api/state/wipe/:key", (req, res) => {
      const key = req.params.key;
      this.removeKey(key);
      res.json(this.state);
    });

    this.app.get("/api/state/wipe", (req, res) => {
      this.removeAllKeys();
      res.json(this.state);
    });
  }

  getAll() {
    return this.state;
  }

  getState(key) {
    return this.state[key];
  }

  setState(key, value) {
    this.state[key] = value;
  }

  listenToWsServer() {
    // store incoming messages to state
    this.wsServer.on("connection", (connection, request, client) => {
      connection.on("message", (message, isBinary) => {
        try {
          const json = JSON.parse(message);
          if (json.store) {
            this.setStateData(json);
          }
        } catch (error) {
          console.error("Error parsing incoming message:", error);
        }
      });
    });
  }

  setStateData(data) {
    if (!data.store) return;

    // add time to message
    data.time = Date.now();

    // store whole message to re-broadcast later
    this.state[data.key] = data;
    this.saveStateToFile();
  }

  removeKey(key) {
    delete this.state[key];
    this.saveStateToFile();
  }

  removeAllKeys() {
    for (let key in this.state) {
      delete this.state[key];
    }
    this.saveStateToFile();
  }

  async saveStateToFile() {
    if (Date.now() - this.lastSaveTime > 1000) {
      // save state to file no more than every second
      this.lastSaveTime = Date.now();
      try {
        await fs.writeFile(this.dataPath, JSON.stringify(this.state, null, 2));
      } catch (error) {
        logGreen("⚠️ Error saving state to file:", error);
      }
    }
  }

  async loadStateFromFile() {
    await fs.mkdir(this.baseDataPath, { recursive: true });
    try {
      // try to load file and load state from it
      logGreen("📂 Loading persistent state from file:", this.dataPath);
      const data = await fs.readFile(this.dataPath, "utf-8");
      Object.assign(this.state, JSON.parse(data));
      let numKeys = Object.keys(this.state).length;
      logGreen(`✅ Persistent state loaded from file with (${numKeys}) keys`);
    } catch (error) {
      logGreen("🚨 Error loading state from file:", this.dataPath); // error
      logGreen("🤔 This was probably the first run, so this error is probably okay 🤞");
      // create empty dir & file if it doesn't exist: ./data/state.json
      try {
        logGreen("📂 Writing empty state to file:", this.dataPath);
        await fs.writeFile(this.dataPath, "{}");
        logGreen("✅ Created empty state file. Let's go!");
      } catch (error) {
        logGreen("🚨 Error writing empty state file:", error);
      }
    }
  }
}

export default PersistentState;
export { PersistentState };
