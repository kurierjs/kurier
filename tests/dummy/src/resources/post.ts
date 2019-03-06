import { Resource } from "../jsonapi-ts";

function belongsTo(type: string, options = {}) {
  return { type, kind: "belongsTo", ...options };
}

export default class Post extends Resource {
  static attributes = {
    title: "",
    body: "",
    userId: ""
  };

  static relationships = {
    user: belongsTo("user", { name: "user" })
  };
}
