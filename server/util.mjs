import os from "os";

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

function getValueFromArgs(argName, defaultVal) {
  const args = process.argv.slice(2);
  const index = args.indexOf(argName);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultVal;
}

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
  console.log("\x1b[42m%s\x1b[0m", ...args);
}
function logYellow(...args) {
  console.log("\x1b[43m%s\x1b[0m", ...args);
}
function logBlue(...args) {
  console.log("\x1b[44m%s\x1b[0m", ...args);
}
function logMagenta(...args) {
  console.log("\x1b[45m%s\x1b[0m", ...args);
}
function logCyan(...args) {
  console.log("\x1b[46m%s\x1b[0m", ...args);
}
function logGray(...args) {
  console.log("\x1b[100m%s\x1b[0m", ...args);
}

export default ipAddr;
export {
  getLocalIpAddress,
  ipAddr,
  getValueFromArgs,
  eventLog,
  logBlue,
  logRed,
  logGreen,
  logYellow,
  logMagenta,
  logCyan,
  logGray,
};
