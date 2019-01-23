import Koa from "koa";

import { Application, JsonApiKoa, KnexProcessor } from "./jsonapi-ts";

const app = new Application({
  types: [],
  processors: [],
  defaultProcessor: new KnexProcessor({
    client: "sqlite3",
    connection: {
      file: ":memory:"
    }
  })
});

const koa = new Koa();
// koa.use(JsonApiKoa(app));
