import { Resource } from "../kurier";

export default class Link extends Resource {
  static schema = {
    attributes: {
      body: String
    },

    relationships: {}
  };
}
