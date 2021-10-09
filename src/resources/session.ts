import Resource from "../resource";
import User from "./user";
import Password from "../attribute-types/password";

export default class Session extends Resource {
  public static get type() {
    return "session";
  }

  public static schema = {
    attributes: {
      token: String,
      username: String,
      password: Password,
    },
    relationships: {
      user: {
        type: () => User,
        belongsTo: true,
      },
    },
  };
}
