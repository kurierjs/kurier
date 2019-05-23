import * as Knex from "knex";
import { Application, KnexProcessor, UserManagementAddon, UserManagementAddonOptions } from "./jsonapi-ts";
import ArticleProcessor from "./processors/article";
import Article from "./resources/article";
import User from "./resources/user";
import Comment from "./resources/comment";
import Vote from "./resources/vote";
import VoteProcessor from "./processors/vote";
import knexfile from "./knexfile";

import login from "./callbacks/login";
import encryptPassword from "./callbacks/encrypt-password";
import MyVeryOwnUserProcessor from "./processors/user";

const knexConfig = knexfile[process.env.NODE_ENV || "development"];

const app = new Application({
  namespace: "api",
  types: [Article, Comment, Vote],
  processors: [ArticleProcessor, VoteProcessor],
  defaultProcessor: KnexProcessor
});

app.use(UserManagementAddon, {
  userResource: User,
  userProcessor: MyVeryOwnUserProcessor,
  userLoginCallback: login,
  async userRolesProvider(this: MyVeryOwnUserProcessor<User>, user: User) {
    return ["Admin"];
  }
  // userGenerateIdCallback: async () => (-Date.now()).toString(),
  // userEncryptPasswordCallback: encryptPassword
} as UserManagementAddonOptions);

app.services.knex = Knex(knexConfig);

export default app;
