import * as Knex from "knex";
import * as Koa from "koa";
import { Server } from "ws";
import {
  Application,
  jsonApiKoa,
  KnexProcessor,
  jsonApiWebSocket,
  Operation,
  UserProcessor,
  SessionProcessor,
  Session,
  ResourceAttributes
} from "./jsonapi-ts";
import ArticleProcessor from "./processors/article";
import Article from "./resources/article";
import User from "./resources/user";
import Comment from "./resources/comment";
import Vote from "./resources/vote";
import VoteProcessor from "./processors/vote";

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
  types: [User, Article, Comment, Vote, Session],
  processors: [
    ArticleProcessor,
    UserProcessor,
    SessionProcessor,
    VoteProcessor
  ],
  defaultProcessor: KnexProcessor
});

app.services.knex = Knex(knexConfig);
app.services.login = async (op: Operation, user: ResourceAttributes) => {
  return (
    op.data.attributes.email === user.email &&
    op.data.attributes.password === user.password
  );
};

const koa = new Koa();
koa.use(jsonApiKoa(app));

const server = koa.listen(3000);

const ws = new Server({
  server
});

jsonApiWebSocket(ws, app);

console.log("Server up on port 3000");
