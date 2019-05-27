import { Server } from "ws";
import { jsonApiWebSocket } from "./jsonapi-ts";
import app from "./app";
import httpServer from "./http";

const server = httpServer.listen(3000);

const ws = new Server({
  server
});

jsonApiWebSocket(ws, app);

console.log("Server up on port 3000");
