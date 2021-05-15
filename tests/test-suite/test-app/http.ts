import app from "./app";
import * as Koa from "koa";
import * as express from "express";
import { jsonApiKoa, jsonApiExpress } from "./kurier";

const koaApp = new Koa();
koaApp.use(async (ctx, next) => {
  if (ctx.req.url === '/favicon.ico') {
    console.log(ctx.req);
    ctx.res.statusCode = 404;
    ctx.res.end();
  } else {
    await next();
  }
});
koaApp.use(jsonApiKoa(app));

const expressApp = express();
// todo skip favicon
expressApp.use(jsonApiExpress(app));

export { expressApp, koaApp };
export default koaApp;
