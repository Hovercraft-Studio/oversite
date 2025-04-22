import WebSocket from "ws";
import PersistentState from "./persistent-state.mjs";
import { logGreen } from "./util.mjs";

class SocketServer {
  constructor(wsServer, app, baseDataPath, debug) {
    this.wsServer = wsServer;
    this.wssPort = wsServer.options.port;
    this.app = app;
    this.baseDataPath = baseDataPath;
    this.debug = debug;

    // Create persistent state instance
    this.persistentState = new PersistentState(wsServer, app, baseDataPath, "state");

    // Bind methods to this instance
    this.handleConnection = this.handleConnection.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);

    // Set up connection listener and routes
    this.wsServer.on("connection", this.handleConnection);
    this.addDebugListeners();
    this.addRoutes();
  }

  addDebugListeners() {
    this.wsServer.on("error", (err) => {
      logGreen("⚠️ WebSocket server error:", err);
    });
    this.wsServer.on("listening", () => {
      if (this.wsServer.options.port) logGreen(`🎉 WebSocket server listening on port ${this.wsServer.options.port}`);
      else logGreen(`🎉 WebSocket server listening via express server`);
    });
    this.wsServer.on("connection", (ws, req) => {
      logGreen(`WebSocket connection received from ${req.socket.remoteAddress}`);
      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  addRoutes() {
    this.app.get("/api/state/clients", (req, res) => {
      let clients = [];
      this.clients().forEach((client) => {
        clients.push({
          sender: client.senderID,
          connectedTime: Date.now() - client.startTime,
        });
      });
      res.json(clients);
    });
  }

  clients() {
    return this.wsServer.clients;
  }

  handleConnection(connection, request, client) {
    // get sender from searchParams and add metadata to connection object. format is: /ws?sender=MONITOR_DEMO
    let fullReqURL = this.wssPort ? `ws://localhost:${this.wssPort}${request.url}` : `ws://localhost${request.url}`; // handle production where there's no port
    if (this.debug) logGreen(`🤗 Client joined from ${fullReqURL}`);
    const searchParams = new URL(fullReqURL).searchParams;
    const sender = searchParams.get("sender");
    connection.senderID = sender;
    connection.senderID ??= "unknown";
    const sendonly = searchParams.get("sendonly");
    connection.sendonly = !!sendonly;
    connection.startTime = Date.now(); // used by server.mjs for uptime

    // Log new connection
    logGreen(`🤗 Client joined from ${fullReqURL} - We have ${this.clients().size} users`);

    // Set up message and close listeners
    connection.on("message", (message, isBinary) => this.handleMessage(connection, message, isBinary));
    connection.on("close", () => this.handleClose(connection));
  }

  handleMessage(connection, message, isBinary) {
    if (this.debug) logGreen(`[JSON IN]: ${message}`);

    // check for 'receiver'
    let receiver = null;
    if (message.indexOf("receiver") > -1) {
      // make sure we really have a specified receiver
      try {
        let data = JSON.parse(message);
        if (data.receiver) receiver = data.receiver;
      } catch (e) {
        logGreen("❌ Error parsing JSON message");
      }
    }

    // check for sendonly
    let sendOnly = message.indexOf("sendonly") > -1;

    // relay incoming message to all clients
    this.clients().forEach((client) => {
      let isSelf = client === connection;
      let isReceiver = receiver && client.senderID == receiver;
      if (client.readyState === WebSocket.OPEN) {
        // relay message:
        // - if client is not sendonly
        // - if client is the receiver or if no receiver is specified or if sender is monitor
        // - if message is not sendonly or if message is sendonly and client is not the sender
        if (!client.sendonly) {
          if (!receiver || isReceiver || client.senderID == "monitor") {
            if (!sendOnly || (sendOnly && !isSelf)) {
              client.send(message, { binary: isBinary });
            }
          }
        }
      }
    });
  }

  handleClose(connection) {
    logGreen("👋 Client left - We have " + this.clients().size + " users");
  }
}

export default SocketServer;
