import AppStoreDistributed from "../js/haxademic.js/app-store-distributed.mjs";

// need to use 127 instead of localhost
const appStore = new AppStoreDistributed("ws://127.0.0.1:3001/ws");
console.log("AppStoreDistributed instance created:");

// listen to all updates
appStore.addListener({
  storeUpdated: (key, value) =>
    console.log("AppStoreDistributed updated:", key, value),
});

// listen to a specific key
appStore.addListener(
  {
    SLIDER_1: (value) => {
      console.log("SLIDER_1 updated:", value);
    },
  },
  "SLIDER_1"
);
