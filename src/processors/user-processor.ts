import Authorize from "../decorators/authorize";
import { Operation, HasId } from "../types";
import User from "../resources/user";
import KnexProcessor from "./knex-processor";
import Resource from "../resource";

export default class UserProcessor<T extends User> extends KnexProcessor<T> {
  public static resourceClass = User;

  async identify(op: Operation): Promise<HasId[] | HasId> {
    return super.get({ ...op, params: {} });
  }

  protected async generateId(): Promise<any> {}
  protected async encryptPassword(op: Operation): Promise<any> {
    throw new Error("You must implement a password encryption mechanism.");
  }

  async add(op: Operation): Promise<HasId> {
    const fields = Object.assign(
      {},
      ...Object.keys(op.data?.attributes as { [key: string]: Function })
        .filter(
          (attribute) => !this.appInstance.app.serializer.isSensitiveAttribute(this.resourceClass.schema, attribute),
        )
        .map((attribute) => ({ [attribute]: op.data?.attributes[attribute] })),
    );

    const id = await this.generateId();

    const encryptedPassword = await this.encryptPassword(op);

    return super.add({
      ...op,
      data: {
        ...op.data,
        id,
        attributes: {
          ...fields,
          ...encryptedPassword,
        },
      } as Resource,
    });
  }

  @Authorize()
  async get(op: Operation): Promise<HasId[] | HasId> {
    return super.get(op);
  }
}
