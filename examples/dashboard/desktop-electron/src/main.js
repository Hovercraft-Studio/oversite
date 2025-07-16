// import { app, BrowserWindow, Menu, ipcMain, dialog } from "electron";
import { app, BrowserWindow, ipcMain, Menu, desktopCapturer, session } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import started from "electron-squirrel-startup";
import Store from "electron-store";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let store = new Store();
let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true, // Enable Node.js integration in the renderer process
      contextIsolation: true, // Disable context isolation to allow direct access to Node.js APIs
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // only happens once per window launch
  init();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  buildBridgeToFrontend();
  addScreenCapturePermission();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

function init() {
  mainWindow.webContents.openDevTools();
}

function buildBridgeToFrontend() {
  ipcMain.on("message-to-main", handleMessageToMain);
  ipcMain.handle("read-file", async (event, filePath) => {
    try {
      const fullPath = path.resolve(filePath);
      const data = await fs.readFile(fullPath, "utf8");
      return data;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });
}

function sendMessageToFrontend(data) {
  mainWindow.webContents.send("message-to-frontend", data);
}

function handleMessageToMain(event, data) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  event.reply("message-to-frontend", Object.assign({ pong: true }, data)); // pong the sent data back to the renderer

  // handle specific commands
  if (data.key === "frontend_active") {
    let deepCopyVersions = JSON.parse(JSON.stringify(process.versions));
    sendMessageToFrontend({
      key: "main_config",
      value: {
        versions: deepCopyVersions,
      },
    });
    sendSystemInfoToFrontend();
  }
  if (data.key === "set_title") {
    win.setTitle(data.value);
    sendMessageToFrontend({ key: "title_updated", data: data });
  }
}

function sendSystemInfoToFrontend() {
  /*
      const ramUsage = await Neutralino.computer.getMemoryInfo();
      const arch = await Neutralino.computer.getArch();
      const kernelInfo = await Neutralino.computer.getKernelInfo();
      const osInfo = await Neutralino.computer.getOSInfo();
      const cpuInfo = await Neutralino.computer.getCPUInfo();
      const displaysArr = await Neutralino.computer.getDisplays();

      const architecture = arch;
      const os = `${osInfo.name} ${osInfo.version}`;
      const kernel = `${kernelInfo.variant} ${kernelInfo.version}`;
      const cpu = `${cpuInfo.model} (${cpuInfo.physicalCores} cores, ${cpuInfo.logicalThreads} threads)`;
      const ram = `Available: ${(ramUsage.physical.available / (1024 * 1024 * 1024)).toFixed(2)} GB / Total: ${(
        ramUsage.physical.total /
        (1024 * 1024 * 1024)
      ).toFixed(2)} GB`;

  */
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    versions: process.versions,
    uptime: process.uptime(),
    systemVersion: process.getSystemVersion(),
    memory: {
      total: process.memoryUsage().heapTotal,
      used: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
    },
    heapStatistics: process.getHeapStatistics(),
    cpu: process.cpuUsage(),
    pid: process.pid,
  };
  sendMessageToFrontend({ key: "system_info", value: systemInfo });
}

function addScreenCapturePermission() {
  // from: https://www.electronjs.org/docs/latest/api/desktop-capturer
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
        // Grant access to the first screen found.
        callback({ video: sources[0], audio: "loopback" });
      });
      // If true, use the system picker if available.
      // Note: this is currently experimental. If the system picker
      // is available, it will be used and the media request handler
      // will not be invoked.
    },
    { useSystemPicker: true }
  );
}
