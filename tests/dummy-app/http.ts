import app from "./app";
import * as Koa from "koa";
import * as express from "express";
import { jsonApiKoa, jsonApiExpress } from "./jsonapi-ts";

const koaApp = new Koa();
koaApp.use(jsonApiKoa(app));

const expressApp = express();
expressApp.use(jsonApiExpress(app));

export { expressApp, koaApp };
export default koaApp;
