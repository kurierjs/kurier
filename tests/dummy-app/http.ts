import app from "./app";
import * as Koa from "koa";
import { jsonApiKoa } from "./jsonapi-ts";

const koa = new Koa();
koa.use(jsonApiKoa(app));

export default koa;
