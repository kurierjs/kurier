import { Resource } from "../jsonapi-ts";
import User from "./user";

export default class Article extends Resource {
  static schema = {
    attributes: {
      body: String
    },

    relationships: {
      author: {
        type: () => User,
        key: "author",
        belongsTo: true
      }
    }
  };
}
