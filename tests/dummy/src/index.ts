import * as Koa from "koa";
import { Application, jsonApiKoa, KnexProcessor } from "./jsonapi-ts";
import User from "./resources/user/resource";
import { registerKnex } from '@jsonapi-ts/knex';

const app = new Application({
  namespace: "api",
  types: [User],
  processors: [],
  defaultProcessor: KnexProcessor
});

registerKnex(app, {
  client: "sqlite3",
  connection: {
    filename: "./tests/dummy/db/dev.sqlite3"
  },
  useNullAsDefault: true
});

function registerKnex(app, options) {
  app.services.knex = new Knex(options);
}

const koa = new Koa();

koa.use(jsonApiKoa(app));
koa.listen(3000);

console.log("Server up on port 3000");
