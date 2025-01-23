import AppStoreElement from "./app-store-element.js";
import DateUtil from "../date-util.mjs";

class AppStoreHeartbeat extends AppStoreElement {
  initStoreListener() {
    this.displays = this.getAttribute("show") == "true";
    this.startInterval();
    super.initStoreListener();
  }

  startInterval() {
    // get interval from web component attribute
    let interval = this.getAttribute("interval");
    interval ??= 5000;
    interval = parseInt(interval);
    // start count
    this.startTime = Date.now();
    _store.set(this.storeKey, 0, true);
    // set interval
    setInterval(() => {
      let uptime = Date.now() - this.startTime;
      _store.set(this.storeKey, uptime, true);
    }, interval);
  }

  setStoreValue(value) {
    this.render();
  }

  css() {
    return /*css*/ ``;
  }

  html() {
    return /*html*/ this.displays
      ? `<div>Heartbeat uptime: ${DateUtil.formattedTime(
          this.valueFromStore
        )}</div>`
      : "";
  }

  static register() {
    customElements.define("app-store-heartbeat", AppStoreHeartbeat);
  }
}

AppStoreHeartbeat.register();

export default AppStoreHeartbeat;
