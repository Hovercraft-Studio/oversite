// install:
// - npm install ws --save-dev
// run:
// - node ws-relay.mjs [--debug]

"use strict";
process.title = "node-ws";

/////////////////////
// Imports
/////////////////////

import WebSocket, { WebSocketServer } from "ws";
import ipAddr from "./util.mjs";

/////////////////////
// Config/args
/////////////////////

const args = process.argv.slice(2);
const portArgIndex = args.indexOf("--port");
const wssPort = portArgIndex != -1 ? parseInt(args[portArgIndex + 1]) : 3001;
const debug = args.indexOf("--debug") != -1;

function eventLog(...args) {
  console.log("===================================");
  for (let arg of args) {
    console.log("\x1b[42m%s\x1b[0m", arg);
  }
  console.log("===================================");
}

/////////////////////
// BUILD WS SERVER
/////////////////////

// start server
const wsServer = new WebSocketServer({
  port: wssPort,
  host: "0.0.0.0", // allows connections from localhost and IP addresses
  path: "/ws",
}); // For Heroku launch, remove `port`! Example server config here: https://github.com/heroku-examples/node-websockets
eventLog(
  `Running WebSocket server at port: ${wssPort}`,
  `Connect at ws://localhost:${wssPort}/ws`,
  `or ws://${ipAddr}:${wssPort}/ws`
);

// listen for new connections
wsServer.on("connection", (connection, request, client) => {
  // Log new connection and add metadata to connection object
  eventLog("Client joined - We have " + wsServer.clients.size + " users");
  connection.startTime = Date.now();
  // get sender from searchParams
  // format is: /ws?sender=MONITOR_DEMO
  let fullReqURL = `ws://localhost:${wssPort}${request.url}`;
  const searchParams = new URL(fullReqURL).searchParams;
  console.log("Client connection URL", fullReqURL);
  const sender = searchParams.get("sender");
  connection.senderID = sender;
  connection.senderID ??= "unknown";
  console.log("new connection with sender:", connection.senderID);

  // handle incoming messages
  connection.on("message", (message, isBinary) => {
    if (debug) console.log(`[JSON IN]: ${message}`);

    // relay incoming message to all clients
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // attach sender id to connection
        matchClientWithSenderId(connection, client, message);
        // relay message
        client.send(message, { binary: isBinary });
      }
    });
  });

  // handle client disconnect
  connection.on("close", () => {
    eventLog("Client left - We have " + wsServer.clients.size + " users");
  });
});

// if message is coming from own connection, check for send so we can attach to connection
function matchClientWithSenderId(connection, client, message) {
  if (client == connection) {
    // only attach sender if we haven't already
    if (!client.senderID) {
      if (message.indexOf("sender")) {
        try {
          let json = JSON.parse(message);
          if (json.sender) {
            // attach sender to client
            client.senderID = json.sender;
          }
        } catch (error) {
          console.error("Error parsing sender ID:", error);
        }
      }
    }
  }
}

export default wsServer;
export { wsServer, eventLog };
