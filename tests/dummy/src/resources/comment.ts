import { Resource } from "../jsonapi-ts";
import User from "./user";

export default class Comment extends Resource {
  static schema = {
    attributes: {
      body: String,
      author_Id: Number
    },

    relationships: {
      author: {
        type: () => User,
        belongsTo: true,
        foreignKeyName: 'author_id'
      }
    }
  };
}
