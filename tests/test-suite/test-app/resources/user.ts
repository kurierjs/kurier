import { User as JsonApiUser, Password } from "../jsonapi-ts";
import Article from "./article";
import Vote from "./vote";
import Comment from "./comment";

export default class User extends JsonApiUser {
  static schema = {
    attributes: {
      username: String,
      email: String,
      password: Password
    },

    relationships: {
      articles: {
        type: () => Article,
        hasMany: true,
        foreignKeyName: "author"
      },
      comments: {
        type: () => Comment,
        hasMany: true,
        foreignKeyName: "author_id"
      },
      votes: {
        type: () => Vote,
        hasMany: true
      }
    }
  };
}
