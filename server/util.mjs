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

export default ipAddr;
export { getLocalIpAddress };
