import { Resource } from "../jsonapi-ts";
import Article from "./article";
import Comment from "./comment";

export default class User extends Resource {
  static schema = {
    attributes: {
      email: String
    },

    relationships: {
      articles: {
        type: () => Article,
        hasMany: true,
        foreignKeyName: "authorId"
      },
      comments: {
        type: () => Comment,
        hasMany: true,
        foreignKeyName: "author_id"
      }
    }
  };
}
