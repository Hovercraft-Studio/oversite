// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // to main
  messageToBackend: (data) => ipcRenderer.send("message-to-main", data),
  // from main
  onMessageToFrontend: (callback) => ipcRenderer.on("message-to-frontend", (_event, value) => callback(value)),
});

// Store API for persistent storage
// This uses electron-store to manage persistent storage in the app

import Store from "electron-store";

const store = new Store();
contextBridge.exposeInMainWorld("electronStore", {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
  clear: () => store.clear(),
  has: (key) => store.has(key),
});
