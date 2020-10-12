import { Resource } from "../jsonapi-ts";

export default class Random extends Resource {
  static schema = {
    attributes: {
      randomString: String,
      randomNumber: Number,
      randomDate: String
    },
    relationships: {}
  };
}
