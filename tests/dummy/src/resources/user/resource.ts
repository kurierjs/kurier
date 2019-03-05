import { Resource } from "../../jsonapi-ts";

export default class User extends Resource {
  static attributes = {
    email: String,
    friends: Array,
    coolFactor: Number
  }

  static relationships: {
    posts: ''
  };
}
