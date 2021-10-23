import { Resource } from "../kurier";
import User from "./user";

export default class Comment extends Resource {
  static schema = {
    primaryKeyName: "_id",
    attributes: {
      body: String,
      type: String,
    },
    relationships: {
      author: {
        type: () => User,
        belongsTo: true,
        foreignKeyName: "author_id",
      },
      parentComment: {
        type: () => Comment,
        belongsTo: true,
      },
    },
  };
}
