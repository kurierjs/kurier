import { Resource } from "../jsonapi-ts";
import User from "./user";
import Vote from "./vote";
import Comment from "./comment";

export default class Article extends Resource {
  static schema = {
    attributes: {
      body: String
    },

    relationships: {
      author: {
        type: () => User,
        belongsTo: true
      },
      votes: {
        type: () => Vote,
        hasMany: true,
        foreignKeyName: 'article_id'
      },
      comments: {
        type: () => Comment,
        hasMany: true,
        foreignKeyName: 'author_id'
      }
    }
  }
}
