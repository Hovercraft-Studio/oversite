class SolidSocket {
  constructor(wsURL) {
    this.active = true;
    this.wsURL = wsURL;
    this.init();
  }

  async init() {
    await this.initSocketClass();
    if (typeof window !== "undefined") this.hasWindow = true;
    this.bindCallbacks();
    let startDelay = this.hasWindow ? 0 : 500; // node needs a moment to init
    setTimeout(() => {
      this.buildSocketObject();
      this.startMonitoringConnection();
    }, startDelay);
  }

  async initSocketClass() {
    this.WebSocketClient;
    if (
      typeof window !== "undefined" &&
      typeof window.WebSocket !== "undefined"
    ) {
      // Running in the browser
      this.WebSocketClient = window.WebSocket;
    } else {
      // Running in Node.js
      const { WebSocket } = await import("ws");
      this.WebSocketClient = WebSocket;
    }
  }

  // State

  setClassesConnected() {
    if (!this.hasWindow) return;
    document.body.classList.add("has-socket");
    document.body.classList.remove("no-socket");
  }

  setClassesDisconnected() {
    if (!this.hasWindow) return;
    document.body.classList.add("no-socket");
    document.body.classList.remove("has-socket");
  }

  // Public methods

  setURL(wsURL) {
    this.wsURL = wsURL;
    if (this.socket) this.socket.close();
  }

  isConnected() {
    return this.socket.readyState === this.WebSocketClient.OPEN;
  }

  isConnecting() {
    return this.socket.readyState === this.WebSocketClient.CONNECTING;
  }

  // WebSocket LISTENERS

  bindCallbacks() {
    this.openHandler = this.onOpen.bind(this);
    this.messageHandler = this.onMessage.bind(this);
    this.errorHandler = this.onError.bind(this);
    this.closeHandler = this.onClose.bind(this);
  }

  addSocketListeners() {
    this.socket.addEventListener("open", this.openHandler);
    this.socket.addEventListener("message", this.messageHandler);
    this.socket.addEventListener("error", this.errorHandler);
    this.socket.addEventListener("close", this.closeHandler);
  }

  removeSocketListeners() {
    if (!this.socket) return;
    this.socket.removeEventListener("open", this.openHandler);
    this.socket.removeEventListener("message", this.messageHandler);
    this.socket.removeEventListener("error", this.errorHandler);
    this.socket.removeEventListener("close", this.closeHandler);
    this.socket.close();
  }

  // CALLBACKS

  onOpen(e) {
    console.log("SolidSocket connected: " + this.wsURL);
    this.setClassesConnected();
    if (this.openCallback) this.openCallback(e);
    if (this.connectionActiveCallback) this.connectionActiveCallback(true);
  }

  setOpenCallback(callback) {
    this.openCallback = callback;
  }

  onMessage(e) {
    if (this.messageCallback) this.messageCallback(e);
  }

  setMessageCallback(callback) {
    this.messageCallback = callback;
  }

  onError(e) {
    this.setClassesDisconnected();
    if (this.errorCallback) this.errorCallback(e);
  }

  setErrorCallback(callback) {
    this.errorCallback = callback;
  }

  onClose(e) {
    this.setClassesDisconnected();
    this.resetConnectionAttemptTime();
    if (this.closeCallback) this.closeCallback(e);
  }

  setCloseCallback(callback) {
    this.closeCallback = callback;
  }

  setConnectionActiveCallback(callback) {
    this.connectionActiveCallback = callback;
  }

  // SEND

  sendMessage(message) {
    if (this.isConnected()) {
      this.socket.send(message);
    } else {
      if (this.errorCallback)
        this.errorCallback({
          message: "SolidSocket.sendMessage() failed - not connected",
        });
    }
  }

  sendJSON(data) {
    console.log(data);
    this.sendMessage(JSON.stringify(data));
  }

  // MONITORING & RECONNECTION

  buildSocketObject() {
    this.removeSocketListeners();
    this.socket = new this.WebSocketClient(this.wsURL);
    this.addSocketListeners();
  }

  startMonitoringConnection() {
    this.resetConnectionAttemptTime();
    this.checkConnection();
  }

  resetConnectionAttemptTime() {
    this.lastConnectAttemptTime = Date.now();
  }

  checkConnection() {
    // check for disconnected socket & reinitialize if needed
    // do this on an interval with raf, since setTimeouts/setIntervals
    // are less reliable to actually happen when you come back to an inactive browser tab
    let timeForReconnect =
      Date.now() > this.lastConnectAttemptTime + SolidSocket.RECONNECT_INTERVAL;
    if (timeForReconnect) {
      this.resetConnectionAttemptTime();
      // clean up failed socket object, and
      // initialize a new socket object
      let needsNewSocket = !this.isConnected() && !this.isConnecting();
      if (needsNewSocket) {
        this.buildSocketObject();
      }
    }
    // keep checking connection until disposed
    // use more dependable raf if in browser, or setTimeout if in Node
    if (this.active == true) {
      if (this.hasWindow) {
        window.requestAnimationFrame(() => this.checkConnection());
      } else {
        setTimeout(() => this.checkConnection(), 1000);
      }
    }
  }

  // CLEANUP

  dispose() {
    this.active = false;
    this.removeSocketListeners();
  }
}

SolidSocket.RECONNECT_INTERVAL = 5000;

export default SolidSocket;
