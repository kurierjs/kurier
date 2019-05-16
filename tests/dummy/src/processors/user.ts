import { UserProcessor, Operation } from "../jsonapi-ts";
import User from "../resources/user";
import encryptPassword from "../callbacks/encrypt-password";

export default class MyVeryOwnUserProcessor<T extends User> extends UserProcessor<T> {
  protected async generateId() {
    return `${101}${Date.now()}`;
  }

  protected async encryptPassword(op: Operation) {
    return encryptPassword(op);
  }
}
