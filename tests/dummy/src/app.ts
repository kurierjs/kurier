import * as Knex from "knex";
import { Application, KnexProcessor, Operation, SessionProcessor, Session, ResourceAttributes } from "./jsonapi-ts";
import ArticleProcessor from "./processors/article";
import Article from "./resources/article";
import User from "./resources/user";
import Comment from "./resources/comment";
import Vote from "./resources/vote";
import VoteProcessor from "./processors/vote";
import hash from "./utils/hash";
import UserProcessor from "./processors/user";
import knexfile from "./knexfile";

const knexConfig = knexfile[process.env.NODE_ENV || "development"];

const app = new Application({
  namespace: "api",
  types: [User, Article, Comment, Vote, Session],
  processors: [ArticleProcessor, UserProcessor, SessionProcessor, VoteProcessor],
  defaultProcessor: KnexProcessor
});

app.services.knex = Knex(knexConfig);
app.services.login = async (op: Operation, user: ResourceAttributes) => {
  return (
    op.data.attributes.email === user.email &&
    hash(op.data.attributes.password, process.env.SESSION_KEY) === user.password
  );
};
app.services.password = async (op: Operation) => ({
  password: hash(op.data.attributes.password, process.env.SESSION_KEY)
});

export default app;
