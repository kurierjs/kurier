import { KnexProcessor, Operation } from "../../jsonapi-ts";
import User from "./resource";
import { HasId } from "../../../../../src/processors/operation-processor";

const timeout = (data, time) => new Promise(resolve => setTimeout(() => resolve(data), time));

export default class UserProcessor extends KnexProcessor<User> {
  static resourceClass = User;

  async get(op: Operation): Promise<HasId[]> {
    return super.get(op);
  }

  attributes = {
    async friends(user: User) {
      return await timeout([
        {name: 'Joel'},
        {name: 'Ryan'},
      ], 2000);
    }
  }

  relationships = {
    async articles(user: User) {
      return [];
    }
  }
}
