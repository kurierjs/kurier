import { KnexProcessor } from "../../jsonapi-ts";
import User from "./resource";

const timeout = (data, time) => new Promise(resolve => setTimeout(() => resolve(data), time));

export default class UserProcessor extends KnexProcessor<User> {
  resourceClass = User;

  attributes = {
    async friends(user: User) {
      return await timeout([
        {name: 'Joel'},
        {name: 'Ryan'},
      ], 2000);
    }
  }
}
