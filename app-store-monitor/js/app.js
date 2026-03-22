import MobileUtil from "../../src/util/mobile-util.mjs";
import ErrorUtil from "../../src/util/error-util.mjs";

// custom web components
// anything here?

class CustomApp extends HTMLElement {
  connectedCallback() {
    this.init();
    _store.addListener(this);
    _store.addListener(this, "appstore_connected"); // listen for appStore to connect
  }

  appstore_connected(value) {
    this.populateHeaderLinks();
    this.buildZoomButtons();
    this.buildChannelSwitcher();
  }

  populateHeaderLinks() {
    // set server url right header links
    // these values are populated in AppStoreInit
    let wsURL = _store.get("ws_url");
    let serverURL = _store.get("server_url");

    // read current channel from hash params (set by app-store-init hashParamConfig)
    let hashParams = new URLSearchParams(document.location.hash);
    let currentChannel = hashParams.get("channel") || "default";
    let channelParam = `?channel=${currentChannel}`;

    // populate header links with server URL — state endpoints include channel param
    let stateUrlEl = document.querySelector("a[data-state-url]");
    stateUrlEl.setAttribute("href", `${serverURL}api/state/all${channelParam}`);
    stateUrlEl.textContent = `/state/all (${currentChannel})`;

    document.querySelector("a[data-clients-url]").setAttribute("href", `${serverURL}api/state/clients`);
    document.querySelector("a[data-channels-url]").setAttribute("href", `${serverURL}api/state/channels`);

    let wipeUrlEl = document.querySelector("a[data-wipe-url]");
    wipeUrlEl.setAttribute("href", `${serverURL}api/state/wipe${channelParam}`);
    wipeUrlEl.textContent = `/state/wipe (${currentChannel})`;

    // server url in header
    let headerServerUrl = document.querySelector("a[data-server-address-display]");
    headerServerUrl.innerHTML = serverURL; // `${document.location.hostname}:${document.location.port}`;
    headerServerUrl.removeAttribute("aria-busy");
    headerServerUrl.setAttribute("href", serverURL);
  }

  buildZoomButtons() {
    this.root = document.documentElement;
    this.zoomInButton = document.querySelector("[data-zoom-in]");
    this.zoomOutButton = document.querySelector("[data-zoom-out]");
    this.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-zoom-in")) {
        e.preventDefault();
        const currentSize = this.getFontSize();
        this.setFontSize(currentSize + 0.05);
      }
      if (e.target.hasAttribute("data-zoom-out")) {
        const currentSize = this.getFontSize();
        this.setFontSize(currentSize - 0.05);
      }
    });
  }

  getFontSize() {
    return parseFloat(getComputedStyle(this.root).getPropertyValue("--table-font-size"));
  }

  setFontSize(size) {
    this.root.style.setProperty("--table-font-size", `${size}rem`);
  }

  storeUpdated(key, value) {
    // console.log(key, value);
    if (key == "server_url") {
      // console.log(key, "=", value);
      // set server url right header links
    }
    if (key == "client_connected") {
      _store.set("toast", `🤗 Client joined: ${value}`);
    }
    if (key == "client_disconnected") {
      _store.set("toast", `👋 Client left: ${value}`);
    }
  }

  buildChannelSwitcher() {
    this.channelSelect = document.querySelector("[data-channel-select]");
    if (!this.channelSelect) return;
    this.channelServerURL = _store.get("server_url");
    this.currentChannel = new URLSearchParams(document.location.hash).get("channel") || "default";
    this.knownChannelIds = [];

    this.fetchChannels();
    this.channelPollInterval = setInterval(() => this.fetchChannels(), 5000);

    this.channelSelect.addEventListener("change", (e) => {
      let hashParams = new URLSearchParams(document.location.hash);
      hashParams.set("channel", e.target.value);
      document.location.hash = hashParams.toString();
      window.location.reload();
    });
  }

  fetchChannels() {
    fetch(`${this.channelServerURL}api/state/channels`)
      .then((res) => res.json())
      .then((channels) => {
        let channelIds = channels.map((c) => c.channel);
        if (!channelIds.includes(this.currentChannel)) channelIds.unshift(this.currentChannel);

        // only update DOM if channel list changed
        if (JSON.stringify(channelIds) === JSON.stringify(this.knownChannelIds)) return;
        this.knownChannelIds = channelIds;

        this.channelSelect.innerHTML = channelIds
          .map((id) => `<option value="${id}"${id === this.currentChannel ? " selected" : ""}>${id}</option>`)
          .join("");
      })
      .catch(() => {
        if (this.knownChannelIds.length === 0) {
          this.channelSelect.innerHTML = `<option>${this.currentChannel}</option>`;
        }
      });
  }

  init() {
    ErrorUtil.initErrorCatching();
    MobileUtil.enablePseudoStyles();
  }
}

customElements.define("custom-app", CustomApp);
