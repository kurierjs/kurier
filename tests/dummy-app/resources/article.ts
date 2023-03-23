import { BelongsTo, HasMany, Resource } from "../kurier";
import User from "./user";
import Vote from "./vote";

export default class Article extends Resource {
  static schema = {
    attributes: {
      body: String,
    },

    relationships: {
      author: BelongsTo(User, { foreignKeyName: "author" }),
      votes: HasMany(Vote, { foreignKeyName: "article_id" }),
    },
  };
}
