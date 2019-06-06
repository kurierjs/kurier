import { Server } from "ws";
import { jsonApiWebSocket } from "./jsonapi-ts";
import app from "./app";
import { koaApp, expressApp } from "./http";

const koaServer = koaApp.listen(3000);
const expressServer = expressApp.listen(3001);

const ws = new Server({
  server: koaServer
});

jsonApiWebSocket(ws, app);

console.log("Server up on port 3000 (koa) and 3001 (express)");
