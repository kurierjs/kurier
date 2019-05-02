import { Resource } from "../jsonapi-ts";
import Article from "./article";
import Comment from "./comment";
import Vote from "./vote";

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
      },
      votes: {
        type: () => Vote,
        hasMany: true,
        foreignKeyName: 'user_id'
      }
    }
  };
}
