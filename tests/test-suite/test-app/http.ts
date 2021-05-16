import app from "./app";
import * as Koa from "koa";
import * as express from "express";
import { jsonApiKoa, jsonApiExpress } from "./kurier";

const koaApp = new Koa();
koaApp.use(async (ctx, next) => {
  if (ctx.req.url === '/favicon.ico') {
    ctx.res.statusCode = 404;
    ctx.res.end();
  } else {
    await next();
  }
});
koaApp.use(jsonApiKoa(app));

const expressApp = express();
expressApp.use(async (req, res, next) => {
  if (req.url === '/favicon.ico') {
    res.statusCode = 404;
    res.end();
  } else {
    await next();
  }
});
expressApp.use(jsonApiExpress(app));

export { expressApp, koaApp };
export default koaApp;
