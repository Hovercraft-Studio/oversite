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
  // get sender from searchParams and add metadata to connection object. format is: /ws?sender=MONITOR_DEMO
  let fullReqURL = `ws://localhost:${wssPort}${request.url}`;
  const searchParams = new URL(fullReqURL).searchParams;
  const sender = searchParams.get("sender");
  connection.senderID = sender;
  connection.senderID ??= "unknown";
  const sendonly = searchParams.get("sendonly");
  connection.sendonly = !!sendonly;
  connection.startTime = Date.now(); // used by server.mjs for uptime
  // Log new connection
  eventLog(
    `Client joined from ${fullReqURL} - We have ${wsServer.clients.size} users`
  );

  // handle incoming messages
  connection.on("message", (message, isBinary) => {
    if (debug) console.log(`[JSON IN]: ${message}`);

    // check for 'receiver'
    let receiver = null;
    if (message.indexOf("receiver") > -1) {
      // make sure we really have a specified receiver
      let data = JSON.parse(message);
      if (data.receiver) {
        receiver = data.receiver;
      }
    }

    // check for sendonly
    let sendOnly = message.indexOf("sendonly") > -1;

    // relay incoming message to all clients
    wsServer.clients.forEach((client) => {
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
  });

  // handle client disconnect
  connection.on("close", () => {
    eventLog("Client left - We have " + wsServer.clients.size + " users");
  });
});

export default wsServer;
export { wsServer, eventLog };
