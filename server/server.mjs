import http from "http";

// import websocket server and event log
import { wsServer, eventLog } from "./ws-relay.mjs";
import { state, setStateData, removeKey, removeAllKeys } from "./state.mjs";

// listen for incoming store values
wsServer.on("connection", (connection, request, client) => {
  connection.on("message", (message, isBinary) => {
    try {
      const json = JSON.parse(message);
      if (json.store) {
        setStateData(json);
      }
    } catch (error) {
      console.error("Error parsing incoming message:", error);
    }
  });
});

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200);
    res.end(JSON.stringify({ message: "Welcome to AppStore" }));
  } else if (
    req.url.includes("/state") &&
    req.url.length > 6 &&
    req.method === "GET"
  ) {
    const key = req.url.split("/")[2];
    res.writeHead(200);
    if (state[key]) {
      res.end(JSON.stringify(state[key]));
    } else {
      res.end(JSON.stringify(null));
    }
  } else if (req.url === "/state" && req.method === "GET") {
    res.writeHead(200);
    res.end(JSON.stringify(state));
  } else if (
    req.url.includes("/wipe") &&
    req.url.length > 5 &&
    req.method === "GET"
  ) {
    const key = req.url.split("/")[2];
    removeKey(key);
    res.writeHead(200);
    res.end(JSON.stringify(state));
  } else if (req.url === "/wipe" && req.method === "GET") {
    removeAllKeys();
    res.writeHead(200);
    res.end(JSON.stringify(state));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

const port = 3000;
server.listen(port, () => {
  eventLog(`Web server is running on http://localhost:${port}`);
});
