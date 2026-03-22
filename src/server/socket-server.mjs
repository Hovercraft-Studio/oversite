import WebSocket from "ws";
import PersistentState from "./persistent-state.mjs";
import { logGreen } from "./util.mjs";

class SocketServer {
  DEFAULT_CHANNEL = "default"; // default channel if no channel specified in URL
  SERVER_ID = "server"; // sender ID for server messages
  MONITOR_ID = "monitor"; // sender ID for monitor messages

  constructor(wsServer, app, baseDataPath, allowedChannels = null, debug = false) {
    this.wsServer = wsServer;
    this.wssPort = wsServer.options.port;
    this.app = app;
    this.baseDataPath = baseDataPath;
    this.allowedChannels = allowedChannels; // if null, default is allowed, otherwise, can be necessary to pass in a specified channel if "default" isn't in the allowed list
    this.debug = debug;

    // create channels & per-channel persistent state stores
    this.channels = {};
    this.channelStates = {}; // map of channelId -> PersistentState
    this.getOrCreateState(this.DEFAULT_CHANNEL); // always init default channel state

    // Bind methods to this instance
    this.handleConnection = this.handleConnection.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);

    // Set up connection listener and routes
    this.wsServer.on("connection", this.handleConnection);
    this.addRoutes();
    this.startHeartbeat();
    if (debug) this.addDebugListeners();
  }

  // Get or lazily create a PersistentState for a channel
  getOrCreateState(channelId) {
    if (!this.channelStates[channelId]) {
      this.channelStates[channelId] = new PersistentState(this.baseDataPath, channelId);
      logGreen(`📦 Created persistent state for channel: ${channelId}`);
    }
    return this.channelStates[channelId];
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

  ////////////////////////////////////////////
  // Express routes & json-building
  ////////////////////////////////////////////

  addRoutes() {
    this.app.get("/api/state/channels", (req, res) => this.jsonChannels(req, res));
    this.app.get("/api/state/clients", (req, res) => res.json(this.jsonClients()));
    this.app.get("/api/state/clients/:id", (req, res) => this.jsonClientsInChannel(req, res));

    // Per-channel state API routes — ?channel= param defaults to "default"
    const resolveStore = (req) => {
      const channelId = req.query.channel || this.DEFAULT_CHANNEL;
      return this.getOrCreateState(channelId);
    };

    this.app.get("/api/state/get/:key", (req, res) => {
      const store = resolveStore(req);
      const val = store.getState(req.params.key);
      res.json(val || null);
    });

    this.app.get("/api/state/all", (req, res) => {
      const store = resolveStore(req);
      res.json(store.state);
    });

    this.app.get("/api/state/wipe/:key", (req, res) => {
      const store = resolveStore(req);
      store.removeKey(req.params.key);
      res.json(store.state);
    });

    this.app.get("/api/state/wipe", (req, res) => {
      const store = resolveStore(req);
      store.removeAllKeys();
      res.json(store.state);
    });
  }

  jsonChannels(req, res) {
    // list all channels and their clients
    let channels = Object.keys(this.channels).map((channelId) => {
      let clients = this.channelClients(channelId).map((client) => {
        return { sender: client.senderId, connectedTime: Date.now() - client.startTime };
      });
      return { channel: channelId, clients: clients };
    });
    res.json(channels);
  }

  jsonClients(channelId = null) {
    // return either all clients or clients for a specific channel
    let clients = [];
    let allClients = channelId ? this.channelClients(channelId) : this.allClients();
    allClients.forEach((client) => {
      clients.push({
        sender: client.senderId,
        connectedTime: Date.now() - client.startTime,
        channel: client.channelId,
      });
    });
    return clients;
  }

  jsonClientsInChannel(req, res) {
    let channelId = req.params.id;
    if (!this.channelExists(channelId)) {
      res.status(404).json({ error: "Channel not found" });
      return;
    }
    res.json(this.jsonClients(channelId));
  }

  ////////////////////////////////////////////
  // Broadcast tools
  ////////////////////////////////////////////

  startHeartbeat() {
    // helps keep certain ws clients alive that might otherwise timeout w/inactivity
    setInterval(() => {
      this.broadcastAllChannels(this.createAppStoreObject("💓", "💓"));
    }, 30000);
  }

  createAppStoreObject(key, value, type = "string") {
    // format AppStoreDistributed object
    let data = {
      key: key,
      value: value,
      store: true,
      type: type,
      sender: this.SERVER_ID,
    };
    let jsonStr = JSON.stringify(data);
    return jsonStr;
  }

  broadcastClients(channelId) {
    // format clients list as app-store object
    let data = this.createAppStoreObject("clients", this.jsonClients(channelId), "array");
    this.broadcastMessage(channelId, data); // send only to clients that are not sendonly
  }

  sendStateToClient(connection) {
    // send the persisted state for this client's channel
    if (connection.sendonly) return;
    const store = this.getOrCreateState(connection.channelId);
    const state = store.getAll();
    const stateMsg = this.createAppStoreObject("persistent_state", state, "object");
    if (connection.readyState === WebSocket.OPEN) {
      connection.send(stateMsg);
    }
    if (this.debug) logGreen(`📦 [${connection.senderId}] sent persistent_state for [${connection.channelId}] (${Object.keys(state).length} keys)`);
  }

  broadcastMessage(channelId, message, isBinary = false, sender = null, receiver = null, sendOnly = false) {
    let clients = this.channelClients(channelId);
    clients.forEach((client) => {
      let isSelf = client === sender;
      let isReceiver = receiver && client.senderId == receiver;
      if (client.readyState === WebSocket.OPEN) {
        // relay message:
        // - if client is not sendonly (these clients should never get messages)
        // - if client is the receiver or if no receiver is specified or if sender is monitor (for specific recipients)
        // - if message is not sendonly or if message is sendonly and client is not the sender (doesn't get sent back to sender)
        if (!client.sendonly) {
          if (!receiver || isReceiver || client.senderId == this.MONITOR_ID) {
            if (!sendOnly || (sendOnly && !isSelf)) {
              client.send(message, { binary: isBinary });
            }
          }
        }
      }
    });
  }

  broadcastAllChannels(message, isBinary = false) {
    this.allClients().forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message, { binary: isBinary });
      }
    });
  }

  ///////////////////////////////////////////////////
  // Channels management
  ///////////////////////////////////////////////////

  channelExists(channelId) {
    return !!this.channels[channelId];
  }

  channelClients(channelId) {
    return this.channels[channelId];
  }

  addClientToChannel(connection) {
    let channelId = connection.channelId;
    // create channel if it doesn't exist. if we get this far, we're allowed to create a channel
    if (!this.channels[channelId]) {
      this.channels[channelId] = [];
    }
    this.channels[channelId].push(connection);
  }

  removeClientFromChannel(connection) {
    let channelId = connection.channelId;
    let clients = this.channels[channelId];
    if (clients) {
      let index = clients.indexOf(connection);
      if (index > -1) {
        clients.splice(index, 1);
      }
    }
  }

  logChannelsList() {
    setTimeout(() => {
      logGreen("Channel list:");
      for (var channel in this.channels) {
        logGreen(`-> ${channel} [${this.channelClients(channel).length}] users`);
      }
    }, 100);
  }

  ///////////////////////////////////////////////////
  // Connection & message handling
  ///////////////////////////////////////////////////

  clientAllowed(connection) {
    let channelId = connection.channelId;
    // TODO:
    // - Check authentication from headers or query params

    // check whether channel is allowed based on our list of allowed channels
    if (this.allowedChannels && !this.allowedChannels.includes(channelId)) {
      logGreen(`❌ Channel not allowed, channel not whitelisted: ${channelId}`);
      return false;
    }

    // Check connection credentials - we do this to lock down the ws server
    if (channelId == null || channelId == "null") {
      logGreen(`❌ Client disallowed: no channel`);
      return false;
    }
    return true;
  }

  handleConnection(connection, request) {
    // get sender from searchParams and add metadata to connection object. format is: /ws?sender=MONITOR_DEMO
    let fullReqURL = this.wssPort ? `ws://localhost:${this.wssPort}${request.url}` : `ws://localhost${request.url}`; // handle production where there's no port
    if (this.debug) logGreen(`🤗 Client joined from ${fullReqURL}`);
    let url = request.url; // /ws?sender=tablet&channel=default&sendonly=true
    let host = request.headers.host; // localhost:3003
    let referrer = request.headers.origin; // http://localhost:3002

    // get properties from URL
    const searchParams = new URL(fullReqURL).searchParams;
    connection.channelId = searchParams.get("channel") || this.DEFAULT_CHANNEL;
    connection.senderId = searchParams.get("sender") || "unknown";
    connection.sendonly = !!searchParams.get("sendonly");
    connection.startTime = Date.now(); // used to calculate uptime
    let channelId = connection.channelId;
    let senderId = connection.senderId;

    // add client to channel, which will be created if it doesn't exist
    // if client isn't allowed, close connection
    if (this.clientAllowed(connection)) {
      this.addClientToChannel(connection);
      let clients = this.channelClients(channelId);
      let clientCount = clients.length;

      // Set up message and close listeners
      connection.on("message", (message, isBinary) => this.handleMessage(connection, message, isBinary));
      connection.on("close", () => this.handleClose(connection));

      // send messaging about new client
      let clientConnectedMsg = this.createAppStoreObject("client_connected", senderId);
      this.broadcastMessage(channelId, clientConnectedMsg);
      this.broadcastClients(channelId);
      this.sendStateToClient(connection);
      logGreen(`🤗 [${senderId}] joined [${channelId}] from ${fullReqURL} - We have ${clientCount} users`);
    } else {
      let errorMsg = "❌ Client not allowed: no channel, auth or something else";
      logGreen(errorMsg);
      connection.close(1008, errorMsg); // 1008 = policy violation. This error message should show in the onError listener of the client
    }
  }

  allClients() {
    return this.wsServer.clients;
  }

  handleClose(connection) {
    this.removeClientFromChannel(connection);
    let channelId = connection.channelId;
    let clients = this.channelClients(channelId);
    let clientCount = clients.length;
    logGreen(`👋 Client [${connection.senderId}] left - We have ${clientCount} users`);
    if (clientCount > 0) {
      // send messaging about client leaving if channel isn't empty
      let clientDisconnectedMsg = this.createAppStoreObject("client_disconnected", connection.senderId);
      this.broadcastClients(channelId);
      this.broadcastMessage(channelId, clientDisconnectedMsg);
    } else {
      // if channel is empty, dispose of it
      if (clients.length === 0) {
        delete this.channels[channelId];
        logGreen(`👋 Channel closed: ${channelId}`);
      }
    }
  }

  handleMessage(connection, message, isBinary) {
    if (this.debug) logGreen(`[JSON IN]: ${message}`);

    // get channel-specific persistent state store
    const channelStore = this.getOrCreateState(connection.channelId);

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

    // check for state_delete command — remove a key from this channel's persistent state
    if (message.indexOf("state_delete") > -1) {
      try {
        let data = JSON.parse(message);
        if (data.key === "state_delete" && data.value) {
          channelStore.removeKey(data.value);
          if (this.debug) logGreen(`🗑️ [${connection.senderId}] deleted key: ${data.value} from [${connection.channelId}]`);
          return; // don't relay the delete command itself
        }
      } catch (e) {
        logGreen("❌ Error parsing state_delete message");
      }
    }

    // persist incoming store messages to this channel's state file
    try {
      let data = JSON.parse(message);
      if (data.store) {
        channelStore.setStateData(data);
      }
    } catch (e) {
      // not JSON or not a store message — that's fine, just relay
    }

    // check for sendonly
    let sendOnly = message.indexOf("sendonly") > -1;

    // relay incoming message to clients
    this.broadcastMessage(connection.channelId, message, isBinary, connection, receiver, sendOnly);
  }
}

export default SocketServer;
