import * as Knex from "knex";
import * as Koa from "koa";
import { Application, jsonApiKoa, KnexProcessor } from "./jsonapi-ts";
import ArticleProcessor from "./processors/article";
import UserProcessor from "./processors/user";
import Article from "./resources/article";
import User from "./resources/user";
import Comment from "./resources/comment";
import Vote from "./resources/vote";

const knexConfig = {
  client: "sqlite3",
  connection: {
    filename: "./tests/dummy/db/dev.sqlite3"
  },
  useNullAsDefault: true,
  debug: true
};

const app = new Application({
  namespace: "api",
  types: [User, Article, Comment, Vote],
  processors: [ArticleProcessor, UserProcessor],
  defaultProcessor: KnexProcessor
});

app.services.knex = Knex(knexConfig);

const koa = new Koa();

koa.use(jsonApiKoa(app));
koa.listen(3000);

console.log("Server up on port 3000");
