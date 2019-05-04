
import { Resource } from "../jsonapi-ts";
import User from './user';

export default class Session extends Resource {
  static get type() { return 'session'; }

  static schema = {
    attributes: {
      token: String,
      user: String
    },
    relationships: {
      user: {
        type: () => User,
        belongsTo: true,
        foreignKeyName: 'userId'
      }
    }
  };
}
