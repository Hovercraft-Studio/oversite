/*******************************************************************

# System Commands — Standalone Runner

Connects to an Oversite WebSocket server via AppStoreDistributed
and listens for system commands from the Dashboard. Can run on any
PC that has Node 22+, even without the full Oversite server.

## Usage

  node index.mjs
  node index.mjs --server ws://192.168.1.10:3003/ws
  node index.mjs --server ws://my-oversite.example.com/ws --channel dashboard --sender pc-lobby-01

## Options

  --server   WebSocket URL of the Oversite server (default: ws://127.0.0.1:3003/ws)
  --channel  AppStore channel to join (default: dashboard)
  --sender   Sender ID to identify this machine (default: hostname)
  --auth     Auth key for the WebSocket channel (default: none)

## Sending commands from Dashboard

  Send an AppStore message with the command name as the key and a simple value:
    key: "kill_process"      value: "chrome.exe"
    key: "restart_computer"  value: 10
    key: "send_keys"         value: "{F11}"
    key: "minimize_windows"  value: true
    key: "list_processes"    value: "chrome"

  Responses come back on the same key with "_response" appended:
    key: "kill_process_response"  value: "Killed process: chrome.exe"

## Available commands

  kill_process         value: "chrome.exe" (process name)
  restart_computer     value: 10 (delay in seconds, default 10)
  send_keys            value: "{F11}" (SendKeys syntax)
  minimize_windows     value: true or "teamviewer|anydesk" (pipe-separated patterns)
  list_processes       value: "chrome" (filter) or "" (all)

*******************************************************************/

import os from "os";
import { appStoreInit, getCliArg } from "../../src/server/util.mjs";
import SystemCommands from "../../src/server/system-commands.mjs";

// ---- CLI args ----

const channel = getCliArg("--channel", "dashboard");
const sender = getCliArg("--sender", os.hostname());
const auth = getCliArg("--auth", null);

// ---- Connect & init ----
// appStoreInit reads --server from CLI args (default: ws://127.0.0.1:3003/ws)
// and hydrates persistent state before firing the callback

const appStore = appStoreInit(sender, "*", () => {
  console.log("AppStore connected and hydrated");
  appStore.log();

  // Start listening for system commands from Dashboard
  const systemCommands = new SystemCommands(appStore, sender);

  // Send a heartbeat so the Dashboard knows this client is alive
  const startTime = Date.now();
  setInterval(() => {
    const uptimeMs = Date.now() - startTime;
    appStore.set(`${sender}_heartbeat`, uptimeMs, true);
  }, 10000);
}, channel, auth);
