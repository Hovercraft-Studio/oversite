import AppStore from "./app-store-.mjs";
import SolidSocket from "./solid-socket.mjs";

class AppStoreDistributed extends AppStore {
  static CONNECTED = "appstore_connected";
  static DISCONNECTED = "appstore_disconnected";
  static CUSTOM_JSON = "custom_json";

  constructor(socketServerUrl, senderId = null, channelId = null) {
    super();
    this.stateData = {};

    // get websocket optional props and add to querystring
    this.senderId = senderId || "unknown_" + Math.round(Math.random() * 9999);
    this.channelId = channelId;
    this.socketServerUrl = socketServerUrl;

    // build querystring from options & add to ws:// URL
    const params = new URLSearchParams();
    if (senderId) params.append("sender", this.senderId);
    if (channelId) params.append("channel", this.channelId);
    const queryString = params.toString();
    if (queryString) this.socketServerUrl += "?" + queryString;

    // build socket connection
    this.solidSocket = new SolidSocket(this.socketServerUrl);
    this.solidSocket.setOpenCallback((e) => this.onOpen(e));
    this.solidSocket.setCloseCallback((e) => this.onClose(e));
    this.solidSocket.setMessageCallback((e) => this.onMessage(e));
  }

  onOpen() {
    console.log("AppStoreDistributed connected: " + this.socketServerUrl);
    this.set(AppStoreDistributed.CONNECTED, this.socketServerUrl);
  }

  onClose() {
    console.log("AppStoreDistributed disconnected: " + this.socketServerUrl);
    this.set(AppStoreDistributed.DISCONNECTED, this.socketServerUrl);
  }

  onMessage(event) {
    let data = JSON.parse(event.data);

    // set incoming data on AppStore without broadcasting
    if (data["store"] && data["type"]) {
      data.time = Date.now(); // match stored data
      this.stateData[data["key"]] = data; // store whole message for sender data
      this.set(data["key"], data["value"]);
    } else {
      this.set(AppStoreDistributed.CUSTOM_JSON, data);
    }
  }

  set(key, value, broadcast = false, receiverId = null, sendOnly = false) {
    if (broadcast) {
      // get data type for java AppStore
      var type = "number";
      if (typeof value === "boolean") type = "boolean";
      if (typeof value === "string") type = "string";
      // set json object for AppStore
      let data = {
        key: key,
        value: value,
        store: true,
        type: type,
      };
      if (this.senderId) data.sender = this.senderId;
      if (receiverId) data.receiver = receiverId;
      if (sendOnly) data.sendonly = true;
      this.solidSocket.sendMessage(JSON.stringify(data)); // local AppStore is updated when message is broadcast back to us
    } else {
      super.set(key, value);
    }
  }

  getData(key) {
    return this.stateData[key];
  }

  broadcastCustomJson(obj) {
    this.solidSocket.sendMessage(JSON.stringify(obj));
  }
}

export default AppStoreDistributed;
