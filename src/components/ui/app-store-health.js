import AppStoreElement from "./app-store-element.js";

/**
 * Use boolean mode:
 * <app-store-health key="device_3_health"></app-store-health>
 * - Send a true/false as the value.
 * - This is useful when the other app knows whether something is up or down,
 * - like a camera or device that it controls.
 * or
 * Heartbeat mode:
 * <app-store-health key="device_3_heartbeat" heartbeat timeout="30">
 * <app-store-health key="device_3_heartbeat" heartbeat timeout="30"></app-store-health>
 * - key is a live-updating heartbeat value (e.g. millis() sent every few
 * - seconds). Healthy/unhealthy is derived HERE, from how recently that value last
 * - changed, instead of requiring a separate component to compute and write a derived
 * - "{key}_health" boolean back to the store.
 * - `timeout` - seconds since the last heartbeat update before flipping to unhealthy. Default 60.
 *
 */
class AppStoreHealth extends AppStoreElement {
  subclassInit() {
    this.isHeartbeatMode = this.hasAttribute("heartbeat");
    this.timeoutMs = (parseInt(this.getAttribute("timeout"), 10) || 60) * 1000;
    this.lastSeenAt = null;
    this.hasSeenLiveValue = false; // see setStoreValue() - the first value we ever see for this key isn't trusted as "just happened"

    if (this.isHeartbeatMode) {
      // nothing else re-renders this element between heartbeats, so something has to keep
      // checking "has it been too long" even when no new store value ever arrives again
      this.checkInterval = setInterval(() => this.render(), 1000);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.checkInterval);
  }

  setStoreValue(value) {
    if (this.isHeartbeatMode) {
      if (this.hasSeenLiveValue) this.lastSeenAt = Date.now();
      else this.hasSeenLiveValue = true;
    }
    this.render();
  }

  // A cached value replayed on page load (server hydration, before any live update) is not
  // evidence the device is alive right now - heartbeat values are the device's own millis()
  // (uptime), not wall-clock time, so there's no reliable way to tell how stale a hydrated
  // value already was. Stay "no data yet" (yellow) in heartbeat mode until a genuine live
  // update arrives after this component connects, rather than treating replay-on-load as a
  // fresh heartbeat and flashing green for a device that may already be offline.
  hydrateOnInit() {
    if (this.isHeartbeatMode) {
      this.render();
      return;
    }
    super.hydrateOnInit();
  }

  // true/false/null (null = "no data yet")
  isHealthy() {
    if (this.isHeartbeatMode) {
      if (this.lastSeenAt == null) return null;
      return Date.now() - this.lastSeenAt < this.timeoutMs;
    }
    // original app-store-health behavior: valueFromStore itself is the boolean
    if (
      this.valueFromStore == true ||
      this.valueFromStore == "true" ||
      this.valueFromStore == "1" ||
      this.valueFromStore == 1
    ) {
      return true;
    }
    if (
      this.valueFromStore == false ||
      this.valueFromStore == "false" ||
      this.valueFromStore == "0" ||
      this.valueFromStore == 0
    ) {
      return false;
    }
    return null;
  }

  css() {
    return /*css*/ `
      app-store-health {
        span {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: #ffff00;
          vertical-align: bottom;
        }
        span.healthy {
          background: #00ff00;
        }
        span.unhealthy {
          background: #ff0000;
        }
      }
    `;
  }

  html() {
    const healthy = this.isHealthy();
    let result = `<span title="No data yet"></span>`;
    if (healthy === true) result = `<span class="healthy"></span>`;
    else if (healthy === false) result = `<span class="unhealthy"></span>`;
    return /*html*/ `
      <code>${this.storeKey} ${result}</code>
    `;
  }

  render() {
    this.el.innerHTML = this.html();
    this.injectHeadStyles();
  }

  static register() {
    customElements.define("app-store-health", AppStoreHealth);
  }
}

AppStoreHealth.register();

export default AppStoreHealth;
