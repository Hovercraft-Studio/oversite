import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

/////////////////////////////////
// get relative path to data file
/////////////////////////////////

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, "data/state.json");

/////////////////////////////////
// init state dictionary
/////////////////////////////////

const state = {};
let lastSaveTime = Date.now();

/////////////////////////////////
// pubic function to set state data from ws:// message listener
/////////////////////////////////

function setStateData(data) {
  if (!data.store) return;

  // store whole message to re-broadcast later
  state[data.key] = data;
  saveStateToFile(dataPath);
}

function removeKey(key) {
  delete state[key];
  saveStateToFile(dataPath);
}

function removeAllKeys() {
  for (let key in state) {
    delete state[key];
  }
  saveStateToFile(dataPath);
}

/////////////////////////////////
// persist state to file
/////////////////////////////////

async function saveStateToFile(filePath) {
  if (Date.now() - lastSaveTime > 1000) {
    // save state to file no more than every second
    lastSaveTime = Date.now();
    try {
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error("⚠️ Error saving state to file:", error);
    }
  }
}

async function loadStateFromFile(filePath) {
  try {
    // try to load file and load state from it
    const data = await fs.readFile(filePath, "utf-8");
    Object.assign(state, JSON.parse(data));
    let numKeys = Object.keys(state).length;
    console.log(`✅ State loaded from file with (${numKeys}) keys`);
  } catch (error) {
    console.error("🚨 Error loading state from file:", error);
    console.warn("❔ This was probably the first run");
    // create empty dir & file if it doesn't exist: ./data/state.json
    await fs.mkdir(join(__dirname, "data"), { recursive: true });
    await fs.writeFile(filePath, "{}");
    console.log("✅ Created empty state file. Let's go!");
  }
}

loadStateFromFile(dataPath);

/////////////////////////////////
// export state and functions
/////////////////////////////////

export default state;
export {
  state,
  setStateData,
  removeKey,
  removeAllKeys,
  saveStateToFile,
  loadStateFromFile,
};
