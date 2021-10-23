import { Server } from "ws";
import { jsonApiWebSocket } from "./kurier";
import app from "./app";
import { koaApp, expressApp, vercelApp } from "./http";

const koaServer = koaApp.listen(3000);
const expressServer = expressApp.listen(3001);
const vercelServer = vercelApp.listen(3002);

const ws = new Server({
  server: koaServer,
});

jsonApiWebSocket(ws, app);

console.log("Server up on port 3000 (koa), 3001 (express) and 3002 (vercel)");
