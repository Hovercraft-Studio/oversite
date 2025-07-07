// main imports
import "./frontend/js/main-application.js";
import "./frontend/css/pico.min.css";
import "./frontend/css/index.css";

// Initialize the app store
import AppStore from "./frontend/js/app-store-.mjs";
window._store = new AppStore();

// send/receive messages w/the main process
window.electronAPI.messageToBackend({ key: "frontend_active", value: true });
window.electronAPI.messageToBackend({ key: "set_title", value: "New Title!" });
window.electronAPI.onMessageToFrontend((data) => {
  if (data.pong) {
    console.log(`Received pong from main: ${data.key}`);
  } else {
    console.log(`Messaged from main:`, data);
    if (data.key === "main_config") {
      _store.set("main_config", data.value);
      // _store.set("versions", versions);
      document.body.innerHTML += `<main-application></main-application>`;
      // const versions = data.data.versions;
      // console.log("Main config received:", versions);
      // console.log(`Electron: ${versions.electron}, Chromium: ${versions.chrome}, Node: ${versions.node}`);
    }
    if (data.key === "system_info") {
      // console.log(`System Info: ${JSON.stringify(data.value)}`);
    }
  }
});
