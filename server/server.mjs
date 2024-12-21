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

  let url = req.url;
  let method = req.method;
  let pathSplit = url.split("/");
  let isGET = method === "GET";
  let isPOST = method === "POST";

  if (url === "/" && isGET) {
    // handle root
    res.writeHead(200);
    res.end(JSON.stringify({ message: "Welcome to AppStore" }));
  } else if (url.includes("/state") && url.length > 6 && isGET) {
    // return a single key
    const key = pathSplit[2];
    res.writeHead(200);
    if (state[key]) {
      res.end(JSON.stringify(state[key]));
    } else {
      res.end(JSON.stringify(null));
    }
  } else if (url === "/state" && isGET) {
    // return entire state
    res.writeHead(200);
    res.end(JSON.stringify(state));
  } else if (url.includes("/wipe") && url.length > 5 && isGET) {
    // remove a single key
    const key = pathSplit[2];
    removeKey(key);
    res.writeHead(200);
    res.end(JSON.stringify(state));
  } else if (url === "/wipe" && isGET) {
    // remove all keys
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
