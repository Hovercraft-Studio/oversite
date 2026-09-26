// Example: Drop remote-control onto a bare PC using the oversite npm module
//
// This script connects to an Oversite WebSocket server and listens for
// system commands (kill_process, send_keys, minimize_windows, etc.)
// sent from the Dashboard or any AppStore client.
//
// Use this when the target machine doesn't otherwise have any Oversite
// tooling — it bundles the WebSocket connection, command handlers, and
// heartbeat into a single call.
//
// If your app already has an AppStoreDistributed instance, just do:
//   new SystemCommands(appStore, senderId)
//
// Run:
//   node system-commands-standalone.mjs
//   node system-commands-standalone.mjs --server ws://192.168.1.10:3003/ws --sender pc-lobby-01

import os from "os";
// import { getCliArg } from "oversite/src/server/util.mjs"; // ../../../src/server/util.mjs
// import { createSystemCommandsStandalone } from "oversite/src/server/system-commands.mjs"; // ../../../src/server/system-commands.mjs
import { getCliArg } from "../../../src/server/util.mjs"; // ../../../src/server/util.mjs
import { createSystemCommandsStandalone } from "../../../src/server/system-commands.mjs"; // ../../../src/server/system-commands.mjs

// ---- CLI args (optional — all have sensible defaults) ----

const server = getCliArg("--server", "ws://127.0.0.1:3003/ws");
const channel = getCliArg("--channel", "dashboard");
const sender = getCliArg("--sender", os.hostname());
const auth = getCliArg("--auth", null);

// ---- Connect and start listening (one call) ----

const systemCommands = await createSystemCommandsStandalone({
  server,
  channel,
  sender,
  auth,
  heartbeatInterval: 10000,

  // Optional: register custom commands
  customCommands: {
    // Example: a custom "show_notification" command
    // show_notification: (value) => {
    //   // Windows toast notification via PowerShell
    //   const { exec } = require("child_process");
    //   const { promisify } = require("util");
    //   await promisify(exec)(`powershell -Command "[System.Windows.Forms.MessageBox]::Show('${value}', 'Oversite')" `);
    //   return { message: `Notification sent: ${value}` };
    // },
  },
});

// The returned instance can be extended further if needed:
// systemCommands.addCommand("my_custom_cmd", (value) => { ... });
