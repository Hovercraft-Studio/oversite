import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import os from "os";

const execAsync = promisify(exec);

// Logging - standalone-friendly (doesn't import util.mjs so this file works independently)
function log(...args) {
  console.log("\x1b[46m%s\x1b[0m %s", " system-commands ", ...args);
}

// -----------------------------------------------------------------------
// SystemCommands
//
// Receives commands from Dashboard (or any AppStore client) via
// AppStoreDistributed on a configurable channel (default: "dashboard").
//
// Each command is its own AppStore key, with a simple value:
//   key: "kill_process"          value: "chrome.exe"
//   key: "restart_computer"      value: 10
//   key: "send_keys"             value: "{F11}"
//   key: "minimize_windows"      value: true
//   key: "list_processes"        value: "chrome"
//
// Responds on the same key with "_response" appended:
//   key: "kill_process_response" value: "Killed process: chrome.exe"
//
// Can run:
//   1. Inside server.mjs — pass an existing AppStoreDistributed instance
//   2. As a standalone Node script — see examples/system-commands/index.mjs
// -----------------------------------------------------------------------

class SystemCommands {
  constructor(appStore, senderId = "system_commands") {
    this.appStore = appStore;
    this.senderId = senderId;
    this.platform = os.platform(); // "win32", "darwin", "linux"
    this.commandHandlers = {
      kill_process: this.killProcess.bind(this),
      restart_computer: this.restartComputer.bind(this),
      send_keys: this.sendKeys.bind(this),
      minimize_windows: this.minimizeWindows.bind(this),
      list_processes: this.listProcesses.bind(this),
    };
    this.addListeners();
    log(`System Commands Initialized (platform: ${this.platform}, sender: ${this.senderId})`);
  }

  // ---- AppStore listener setup ----

  addListeners() {
    for (const key of Object.keys(this.commandHandlers)) {
      this.appStore.addListener(this, key);
    }
  }

  // Register a custom command handler and start listening for its key
  // handler receives (value) and must return { message: "..." }
  addCommand(name, handler) {
    this.commandHandlers[name] = handler;
    this.appStore.addListener(this, name);
  }

  // AppStore named-method listener: called when a command key is updated
  // Each command key maps to this[key](value), which we route through executeCommand
  kill_process(value) {
    this.handleCommand("kill_process", value);
  }
  restart_computer(value) {
    this.handleCommand("restart_computer", value);
  }
  send_keys(value) {
    this.handleCommand("send_keys", value);
  }
  minimize_windows(value) {
    this.handleCommand("minimize_windows", value);
  }
  list_processes(value) {
    this.handleCommand("list_processes", value);
  }

  handleCommand(key, value) {
    const messageData = this.appStore.getData(key);
    const requesterId = messageData?.sender || null;
    this.executeCommand(key, value, requesterId);
  }

  async executeCommand(key, value, requesterId = null) {
    const handler = this.commandHandlers[key];
    if (!handler) {
      this.respond(key, false, `Unknown command: ${key}`, requesterId);
      return;
    }
    try {
      const result = await handler(value);
      this.respond(key, true, result.message, requesterId);
    } catch (err) {
      log(`Error executing "${key}":`, err.message);
      this.respond(key, false, err.message, requesterId);
    }
  }

  respond(key, success, message, receiverId = null) {
    log(`${success ? "OK" : "FAIL"} [${key}] ${message}`);
    this.appStore.set(`${key}_response`, message, true, receiverId);
  }

  // ---- Command implementations ----
  // Each handler receives the raw AppStore value for its key

  // key: "kill_process", value: "chrome.exe"
  async killProcess(name) {
    if (!name || typeof name !== "string") throw new Error("Missing process name");
    if (!/^[\w.\-]+$/.test(name)) throw new Error("Invalid process name");

    let cmd;
    if (this.platform === "win32") {
      cmd = `taskkill /F /IM ${name}`;
    } else {
      cmd = `pkill -f ${name}`;
    }
    await execAsync(cmd);
    return { message: `Killed process: ${name}` };
  }

  // key: "restart_computer", value: 10 (delay in seconds, default 10)
  async restartComputer(delaySec) {
    delaySec = Math.max(0, Math.min(delaySec || 10, 300)); // clamp 0–300
    let cmd;
    if (this.platform === "win32") {
      cmd = `shutdown /r /t ${delaySec}`;
    } else {
      cmd = `sudo shutdown -r +${Math.ceil(delaySec / 60) || 1}`;
    }
    await execAsync(cmd);
    return { message: `Restart scheduled in ${delaySec}s` };
  }

  // key: "send_keys", value: "{F11}"
  // Uses .NET SendKeys syntax: https://learn.microsoft.com/en-us/dotnet/api/system.windows.forms.sendkeys
  async sendKeys(keys) {
    if (!keys || typeof keys !== "string") throw new Error("Missing keys string");
    if (!/^[\w\s{}()+^%~]+$/.test(keys)) throw new Error("Invalid keys string");

    if (this.platform === "win32") {
      const psCmd = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keys.replace(/'/g, "''")}')"`;
      await execAsync(psCmd);
      return { message: `Sent keys: ${keys}` };
    } else if (this.platform === "linux") {
      await execAsync(`xdotool key ${keys}`);
      return { message: `Sent keys via xdotool: ${keys}` };
    } else {
      throw new Error(`send_keys not supported on ${this.platform}`);
    }
  }

  // key: "minimize_windows", value: true (defaults to teamviewer)
  // or value: "teamviewer|anydesk" (pipe-separated window title patterns)
  async minimizeWindows(value) {
    if (this.platform !== "win32") throw new Error("minimize_windows is Windows-only");

    let patterns;
    if (value === true || value === "true") {
      patterns = ["teamviewer"];
    } else if (typeof value === "string") {
      patterns = value
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);
    } else {
      patterns = ["teamviewer"];
    }
    for (const p of patterns) {
      if (!/^[\w.\- ]+$/.test(p)) throw new Error(`Invalid pattern: ${p}`);
    }
    const regexPattern = patterns.join("|");

    // Write to a temp .ps1 file to avoid here-string quoting issues
    const psScript = [
      "Add-Type @'",
      "using System;",
      "using System.Runtime.InteropServices;",
      "using System.Text;",
      "public class WinHelper {",
      '  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);',
      '  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int count);',
      '  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);',
      '  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);',
      "  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);",
      "}",
      "'@",
      "[WinHelper]::EnumWindows({",
      "  param($hWnd, $lParam)",
      "  $sb = New-Object Text.StringBuilder 256",
      "  [void][WinHelper]::GetWindowText($hWnd, $sb, 256)",
      "  $title = $sb.ToString()",
      `  if ($title -and [WinHelper]::IsWindowVisible($hWnd) -and $title -match '${regexPattern}') {`,
      '    Write-Host "Minimizing: $title"',
      "    [void][WinHelper]::ShowWindow($hWnd, 6)",
      "  }",
      "  return $true",
      "}, [IntPtr]::Zero) | Out-Null",
    ].join("\n");

    const tmpFile = join(tmpdir(), `oversite-minimize-${Date.now()}.ps1`);
    try {
      await writeFile(tmpFile, psScript, "utf-8");
      await execAsync(`powershell -ExecutionPolicy Bypass -File "${tmpFile}"`);
      return { message: `Minimized windows matching: ${patterns.join(", ")}` };
    } finally {
      unlink(tmpFile).catch(() => {}); // clean up, ignore errors
    }
  }

  // key: "list_processes", value: "chrome" (filter) or "" for all
  async listProcesses(filter) {
    let cmd;
    if (this.platform === "win32") {
      cmd = `tasklist /FO CSV /NH`;
      if (filter && typeof filter === "string" && /^[\w.\-]+$/.test(filter)) {
        cmd = `tasklist /FO CSV /NH /FI "IMAGENAME eq ${filter}*"`;
      }
    } else {
      cmd =
        filter && typeof filter === "string" && /^[\w.\-]+$/.test(filter)
          ? `ps aux | grep -i ${filter} | grep -v grep`
          : `ps aux --sort=-%mem | head -30`;
    }
    const { stdout } = await execAsync(cmd);
    return { message: stdout.trim() };
  }
}

export default SystemCommands;
