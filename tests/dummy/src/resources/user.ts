import { Resource } from "../jsonapi-ts";

function hasMany(type: string, options = {}) {
  return { type, kind: "hasMany", ...options };
}

export default class User extends Resource {
  static attributes = {
    email: ""
  };

  static relationships = {
    posts: hasMany("post", { name: "posts" })
  };
}
