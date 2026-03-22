import { promises as fs } from "fs";
import { join } from "path";
import { logGreen } from "./util.mjs";

class PersistentState {
  constructor(baseDataPath, channelId = "default") {
    this.baseDataPath = join(baseDataPath);
    this.channelId = channelId;

    this.dataPath = join(this.baseDataPath, `state-${this.channelId}.json`);

    this.lastSaveTime = Date.now();
    this.state = {};
    this.loadStateFromFile(this.dataPath);
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

  setStateData(data) {
    if (!data.store) return;
    if (data.key === "state_delete") return; // handled by SocketServer; don't persist the command itself

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
