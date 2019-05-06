import { User as JsonApiUser, Password } from "../jsonapi-ts";
import Article from "./article";
import Comment from "./comment";
import Vote from "./vote";

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
        foreignKeyName: "authorId"
      },
      comments: {
        type: () => Comment,
        hasMany: true,
        foreignKeyName: "author_id"
      },
      votes: {
        type: () => Vote,
        hasMany: true,
        foreignKeyName: "user_id"
      }
    }
  };
}
