import Resource from "../resource";
import Password from "../attribute-types/password";

export default class User extends Resource {
  public static get type() {
    return "user";
  }

  public static schema = {
    attributes: {
      username: String,
      password: Password
    },
    relationships: {}
  };
}
