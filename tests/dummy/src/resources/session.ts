import { Resource, Password } from "../jsonapi-ts";
import User from "./user";

export default class Session extends Resource {
  public static get type() {
    return "session";
  }

  public static schema = {
    attributes: {
      token: String,
      username: String,
      password: Password
    },
    relationships: {
      user: {
        type: () => User,
        belongsTo: true
      }
    }
  };
}
