import Authorize from "../decorators/authorize";
import jsonApiErrors from "../json-api-errors";
import { Operation, HasId } from "../types";
import User from "../resources/user";

import KnexProcessor from "./knex-processor";

export default class UserProcessor<T extends User> extends KnexProcessor<T> {
  public static resourceClass = User;

  async identify(op: Operation): Promise<HasId[]> {
    return super.get({ ...op, params: {} });
  }

  @Authorize()
  async get(op: Operation): Promise<HasId[]> {
    const isRequestingSelfData =
      String(op.ref.id) === String(this.appInstance.user.id);

    if (isRequestingSelfData) {
      return super.get({ ...op, params: {} });
    }

    throw jsonApiErrors.AccessDenied();
  }
}
