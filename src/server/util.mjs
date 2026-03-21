import os from "os";
import AppStoreDistributed from "../app-store/app-store-distributed.mjs";

//////////////////////////////////////
// Networking
//////////////////////////////////////

function getLocalIpAddress() {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return "127.0.0.1"; // Fallback to localhost if no external IP is found
}
const ipAddr = getLocalIpAddress();

function wsUrlToServerUrl(wsURL) {
  // extrapolate http server from ws url and apply port
  // convert ws:// to http://
  let socketURL = new URL(wsURL);
  socketURL.protocol = socketURL.protocol == "ws:" ? "http:" : "https:";
  socketURL.search = "";
  socketURL.pathname = "";
  // this.httpPort = process.env.PORT ?? getCliArg("--port", 3003); // prod uses process.env.PORT, but dev uses --port arg
  // socketURL.port = this.httpPort; // not needed, as the server is already running on the same port
  return socketURL.href;
}

//////////////////////////////////////
// AppStore
//////////////////////////////////////

function appStoreInit(appId, initKeys = null, callback = null, channelId = null, authKey = null) {
  let wsURL = getCliArg("--server", "ws://127.0.0.1:3003/ws"); // need to use 127.0.0.1 instead of localhost!
  authKey = authKey || getCliArg("--auth", null); // also accept --auth from CLI
  let appStore = new AppStoreDistributed(`${wsURL}`, appId, channelId, authKey);
  if (initKeys) {
    // server sends persistent_state on connect — hydrate local store from it, then fire callback
    const handler = {
      persistent_state(stateData) {
        const allKeys = initKeys === "*" || (Array.isArray(initKeys) && initKeys.includes("*"));
        if (allKeys) {
          Object.keys(stateData).forEach((key) => appStore.set(key, stateData[key].value, false));
        } else {
          const keys = Array.isArray(initKeys) ? initKeys : [initKeys];
          keys.forEach((key) => {
            if (stateData[key]) appStore.set(key, stateData[key].value, false);
          });
        }
        appStore.removeListener(handler, "persistent_state");
        if (callback) callback();
      },
    };
    appStore.addListener(handler, "persistent_state");
  } else {
    if (callback) callback();
  }
  return appStore;
}

//////////////////////////////////////
// Get value from command line arguments
//////////////////////////////////////

function getCliArg(argName, defaultVal) {
  const args = process.argv.slice(2);
  const index = args.indexOf(argName);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultVal;
}

//////////////////////////////////////
// Logging functions
//////////////////////////////////////

function eventLog(...args) {
  console.log("===================================");
  for (let arg of args) {
    console.log("\x1b[42m%s\x1b[0m", arg);
  }
  console.log("===================================");
}

// add log functions in different colors
function logRed(...args) {
  console.log("\x1b[41m%s\x1b[0m", ...args);
}
function logGreen(...args) {
  console.log("\x1b[42m%s\x1b[0m %s", " socket-server ", ...args);
}
function logYellow(...args) {
  console.log("\x1b[43m%s\x1b[0m", ...args);
}
function logBlue(...args) {
  console.log("\x1b[44m%s\x1b[0m %s", " server.mjs ", ...args);
}
function logMagenta(...args) {
  console.log("\x1b[45m%s\x1b[0m %s", " dashboard-api ", ...args);
}
function logCyan(...args) {
  console.log("\x1b[46m%s\x1b[0m", " offline-alerts ", ...args);
}
function logGray(...args) {
  console.log("\x1b[100m%s\x1b[0m", ...args);
}

export default ipAddr;
export {
  getLocalIpAddress,
  ipAddr,
  appStoreInit,
  getCliArg,
  wsUrlToServerUrl,
  eventLog,
  logBlue,
  logRed,
  logGreen,
  logYellow,
  logMagenta,
  logCyan,
  logGray,
};
