import app from "./app";
import * as Koa from "koa";
import * as express from "express";
import { createServer } from "vercel-node-server";
import { jsonApiKoa, jsonApiExpress, jsonApiVercel } from "./kurier";

const koaApp = new Koa();
koaApp.use(jsonApiKoa(app, { httpStrictMode: true }));

const expressApp = express();
expressApp.use(jsonApiExpress(app, { httpStrictMode: true }));

const vercelApp = createServer(jsonApiVercel(app, { httpStrictMode: true }));

export { expressApp, koaApp, vercelApp };
export default koaApp;
