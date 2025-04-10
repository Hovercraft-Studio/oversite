import WebSocket from "ws";
import { eventLog } from "./util.mjs";

class SocketServer {
  constructor(wsServer, persistentState, debug) {
    this.wsServer = wsServer;
    this.persistentState = persistentState;
    this.wssPort = wsServer.options.port;
    this.debug = debug;

    // Bind methods to this instance
    this.handleConnection = this.handleConnection.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);

    // Set up connection listener
    this.wsServer.on("connection", this.handleConnection);
  }

  handleConnection(connection, request, client) {
    // get sender from searchParams and add metadata to connection object. format is: /ws?sender=MONITOR_DEMO
    let fullReqURL = `ws://localhost:${this.wssPort}${request.url}`;
    const searchParams = new URL(fullReqURL).searchParams;
    const sender = searchParams.get("sender");
    connection.senderID = sender;
    connection.senderID ??= "unknown";
    const sendonly = searchParams.get("sendonly");
    connection.sendonly = !!sendonly;
    connection.startTime = Date.now(); // used by server.mjs for uptime

    // Log new connection
    eventLog(`Client joined from ${fullReqURL} - We have ${this.wsServer.clients.size} users`);

    // Set up message and close listeners
    connection.on("message", (message, isBinary) => this.handleMessage(connection, message, isBinary));
    connection.on("close", () => this.handleClose(connection));
  }

  handleMessage(connection, message, isBinary) {
    if (this.debug) console.log(`[JSON IN]: ${message}`);

    // check for 'receiver'
    let receiver = null;
    if (message.indexOf("receiver") > -1) {
      // make sure we really have a specified receiver
      try {
        let data = JSON.parse(message);
        if (data.receiver) {
          receiver = data.receiver;
        }
      } catch (e) {
        eventLog("Error parsing JSON message");
      }
    }

    // check for sendonly
    let sendOnly = message.indexOf("sendonly") > -1;

    // relay incoming message to all clients
    this.wsServer.clients.forEach((client) => {
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
    eventLog("Client left - We have " + this.wsServer.clients.size + " users");
  }
}

export default SocketServer;
