import * as Koa from "koa";

import { Application, jsonApiKoa, KnexProcessor } from "./jsonapi-ts";
import Post from "./resources/post";
import User from "./resources/user";

const app = new Application({
  namespace: "api",
  types: [User, Post],
  processors: [],
  defaultProcessor: new KnexProcessor({
    client: "sqlite3",
    connection: {
      filename: "./tests/dummy/db/dev.sqlite3"
    },
    useNullAsDefault: true
  })
});

const koa = new Koa();

koa.use(jsonApiKoa(app));
koa.listen(3000);

console.log("Server up on port 3000");
