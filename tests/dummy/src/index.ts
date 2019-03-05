import * as Koa from "koa";

import { Application, jsonApiKoa, KnexProcessor } from "./jsonapi-ts";
import User from "./resources/user/resource";
import UserProcessor from "./resources/user/processor";

const app = new Application({
  namespace: "api",
  types: [User],
  processors: [
    new UserProcessor({
      client: "sqlite3",
      connection: {
        filename: "./tests/dummy/db/dev.sqlite3"
      },
      useNullAsDefault: true
    })
  ],
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
