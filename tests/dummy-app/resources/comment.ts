import { Resource } from "../jsonapi-ts";
import User from "./user";

export default class Comment extends Resource {
  static schema = {
    primaryKeyName: "_id",
    attributes: {
      body: String,
      type: String
    },
    relationships: {
      author: {
        type: () => User,
        belongsTo: true
      },
      parentComment: {
        type: () => Comment,
        belongsTo: true,
        foreignKeyName: "parent_comment_id"
      }
    }
  };
}
