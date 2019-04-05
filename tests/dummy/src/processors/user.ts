import { KnexProcessor, Operation } from "../jsonapi-ts";
import User from "../resources/user";

export default class UserProcessor extends KnexProcessor<User> {
  static async shouldHandle(op: Operation): Promise<boolean> {
    return op.ref.type === User.type;
  }

  attributes = {
    async friends(user: User) {
      return [{ name: "Joel" }, { name: "Ryan" }];
    },

    coolFactor(): number {
      return 3;
    }
  };

  relationships = {
    async articles(this: UserProcessor, user: User) {
      return await this.knex("articles")
        .where({ authorId: user.id })
        .select();
    }
  };
}
