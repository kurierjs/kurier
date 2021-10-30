import Resource from "../resource";

export default class User extends Resource {
  public static get type() {
    return "user";
  }

  public static schema = {
    attributes: {},
    relationships: {},
  };
}
